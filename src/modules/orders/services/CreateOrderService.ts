import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsList = await this.productsRepository.findAllById(products);

    const existentProductsIds = productsList.map(product => product.id);

    const inexistentProducts = products.filter(
      product => !existentProductsIds.includes(product.id),
    );

    if (inexistentProducts.length) {
      throw new AppError(
        'There are inexistent products on your cart. Please check it again',
      );
    }

    const productsUnavailable = products.filter(
      product =>
        productsList.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (productsUnavailable.length) {
      throw new AppError('There arent enough products available to your cart');
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsList.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });

    if (order) {
      const updatedProductsQuantity = products.map(product => ({
        id: product.id,
        quantity:
          productsList.filter(p => p.id === product.id)[0].quantity -
          product.quantity,
      }));

      await this.productsRepository.updateQuantity(updatedProductsQuantity);
    }

    return order;
  }
}

export default CreateOrderService;
