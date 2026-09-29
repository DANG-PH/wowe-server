import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from '../../common/dto/paginated';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Product } from '../../entities/product.entity';
import { Review } from '../../entities/review.entity';
import { User } from '../../entities/user.entity';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async listByProduct(productId: string, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const [items, total] = await this.reviews.findAndCount({
      where: { product: { id: productId } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(items, total, page, limit);
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const product = await this.products.findOne({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const user = await this.usersService.findById(userId);
    const review = this.reviews.create({
      product: { id: dto.productId } as Product,
      user: { id: userId } as User,
      authorName: user.fullName,
      rating: dto.rating,
      title: dto.title ?? null,
      content: dto.content ?? null,
    });
    const saved = await this.reviews.save(review);
    await this.recompute(dto.productId);
    return saved;
  }

  /** Tính lại điểm trung bình + số lượng đánh giá của sản phẩm. */
  private async recompute(productId: string): Promise<void> {
    const raw = await this.reviews
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.productId = :productId', { productId })
      .getRawOne<{ avg: string | null; count: string }>();
    await this.productsService.refreshRating(
      productId,
      Number(raw?.avg) || 0,
      Number(raw?.count) || 0,
    );
  }
}
