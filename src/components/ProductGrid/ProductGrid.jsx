import { ProductCard } from '../ProductCard/ProductCard.jsx';
import styles from './ProductGrid.module.css';

const EAGER_COUNT = 4;

/**
 * @param {{ products: import('../../api/products.js').Product[] }} props
 */
export function ProductGrid({ products }) {
  return (
    <ul className={styles.grid}>
      {products.map((product, index) => (
        <li key={product.id} className={styles.item}>
          <ProductCard product={product} eager={index < EAGER_COUNT} priority={index === 0} />
        </li>
      ))}
    </ul>
  );
}
