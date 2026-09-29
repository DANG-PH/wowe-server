import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify } from '../../common/utils/slug.util';
import { Category } from '../../entities/category.entity';
import { RedisService } from '../../redis/redis.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

const TREE_CACHE_KEY = 'categories:tree';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    private readonly redis: RedisService,
  ) {}

  async tree(): Promise<CategoryNode[]> {
    const cached = await this.redis.get<CategoryNode[]>(TREE_CACHE_KEY);
    if (cached) return cached;

    const categories = await this.repo.find({
      where: { isActive: true },
      relations: ['parent'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    const tree = this.buildTree(categories);
    await this.redis.set(TREE_CACHE_KEY, tree, 300);
    return tree;
  }

  findAll(): Promise<Category[]> {
    return this.repo.find({
      relations: ['parent'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.repo.findOne({
      where: { slug },
      relations: ['parent', 'children'],
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const category = this.repo.create({
      name: dto.name,
      slug: await this.uniqueSlug(dto.name),
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      sortOrder: dto.sortOrder ?? 0,
      parent: dto.parentId ? ({ id: dto.parentId } as Category) : null,
    });
    const saved = await this.repo.save(category);
    await this.redis.del(TREE_CACHE_KEY);
    return saved;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');

    if (dto.name && dto.name !== category.name) {
      category.slug = await this.uniqueSlug(dto.name);
    }
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.imageUrl !== undefined) category.imageUrl = dto.imageUrl;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.parentId !== undefined) {
      category.parent = dto.parentId ? ({ id: dto.parentId } as Category) : null;
    }

    const saved = await this.repo.save(category);
    await this.redis.del(TREE_CACHE_KEY);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Không tìm thấy danh mục');
    await this.redis.del(TREE_CACHE_KEY);
  }

  private buildTree(categories: Category[]): CategoryNode[] {
    const nodes = new Map<string, CategoryNode>();
    categories.forEach((c) =>
      nodes.set(c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        sortOrder: c.sortOrder,
        children: [],
      }),
    );
    const roots: CategoryNode[] = [];
    categories.forEach((c) => {
      const node = nodes.get(c.id) as CategoryNode;
      if (c.parent && nodes.has(c.parent.id)) {
        nodes.get(c.parent.id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let i = 1;
    while (await this.repo.exists({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}
