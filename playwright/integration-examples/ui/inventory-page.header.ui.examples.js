import utils from '../../support/utils';
import { PRODUCT_COUNT } from '../../constants/ui/inventory-page.ui.constraints';

export const inventoryPageHeader__examples = {
  addedProductIndex: utils.getRandomNumber(0, PRODUCT_COUNT),
  cartBadgeCounts: {
    oneProduct: 1,
  },
};
