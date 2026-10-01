import { resolveAssetUrl } from '../../api/client.js';
import { formatPrice } from '../../lib/formatPrice.js';
import styles from './ProductCard.module.css';

const ratingFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * @param {{ product: import('../../api/products.js').Product, eager: boolean, priority: boolean }} props
 */
export function ProductCard({ product, eager, priority }) {
  const rating = ratingFormatter.format(product.rating);

  return (
    <article className={styles.card} data-testid="product-card">
      <div className={styles.media}>
        <img
          className={styles.image}
          src={resolveAssetUrl(product.image_url)}
          alt={product.title}
          width={600}
          height={600}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
      </div>
      <div className={styles.body}>
        <h2 className={styles.title}>{product.title}</h2>
        <p className={styles.price}>{formatPrice(product.price, product.currency)}</p>
        <div className={styles.meta}>
          <span aria-label={`Рейтинг ${rating} из 5`}>
            <span aria-hidden="true">★ {rating}</span>
          </span>
          <span className={product.in_stock ? styles.inStock : styles.outOfStock}>
            {product.in_stock ? 'В наличии' : 'Нет в наличии'}
          </span>
        </div>
      </div>
    </article>
  );
}
