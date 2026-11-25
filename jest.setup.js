jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Native module; tests never talk to RevenueCat.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: jest.fn(), recordPurchase: jest.fn(), syncPurchases: jest.fn() },
  PURCHASES_ARE_COMPLETED_BY_TYPE: { MY_APP: 'MY_APP' },
  STOREKIT_VERSION: { STOREKIT_2: 'STOREKIT_2' },
}));
