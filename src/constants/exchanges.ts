import type { ImageSourcePropType } from 'react-native';
import type { Exchange } from '../types/common';

export interface ExchangeConfig {
  label: string;
  color: string;
  logo: ImageSourcePropType;
}

export const EXCHANGE_CONFIG: Record<Exchange, ExchangeConfig> = {
  binance: {
    label: 'Binance',
    color: '#F3BA2F',
    logo: require('../../assets/images/exchanges/binance.png'),
  },
  bybit: {
    label: 'Bybit',
    color: '#F7A300',
    logo: require('../../assets/images/exchanges/bybit.png'),
  },
  bingx: {
    label: 'BingX',
    color: '#2665FA',
    logo: require('../../assets/images/exchanges/bingx.png'),
  },
  okx: {
    label: 'OKX',
    color: '#E8E8E8',
    logo: require('../../assets/images/exchanges/okx.png'),
  },
  gateio: {
    label: 'Gate.io',
    color: '#3F7AFD',
    logo: require('../../assets/images/exchanges/gateio.png'),
  },
};
