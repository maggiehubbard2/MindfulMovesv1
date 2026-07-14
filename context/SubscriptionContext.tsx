import {
  ENTITLEMENT_ID,
  REVENUECAT_ANDROID_API_KEY,
  REVENUECAT_IOS_API_KEY,
} from '@/config/revenuecat';
import { useAuth } from '@/context/AuthContext';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
  PurchasesPackage,
  PurchasesOfferings,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

interface SubscriptionContextType {
  isConfigured: boolean;
  isLoading: boolean;
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  entitlementId: string;
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  presentPaywall: () => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

function hasProEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as PurchasesError).message);
  }
  return 'Something went wrong. Please try again.';
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const configuredRef = useRef(false);
  const lastAppUserIdRef = useRef<string | null>(null);

  const refreshCustomerInfo = useCallback(async (): Promise<CustomerInfo | null> => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      if (__DEV__) {
        console.warn('[RevenueCat] getCustomerInfo failed:', getErrorMessage(error));
      }
      return null;
    }
  }, []);

  const refreshOfferings = useCallback(async () => {
    try {
      const next = await Purchases.getOfferings();
      setOfferings(next);
      return next;
    } catch (error) {
      if (__DEV__) {
        console.warn('[RevenueCat] getOfferings failed:', getErrorMessage(error));
      }
      return null;
    }
  }, []);

  // Configure SDK once
  useEffect(() => {
    if (configuredRef.current) return;
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      setIsLoading(false);
      return;
    }

    const configure = async () => {
      try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

        const apiKey =
          Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;

        Purchases.configure({ apiKey });
        configuredRef.current = true;
        setIsConfigured(true);

        Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
        });
      } catch (error) {
        console.error('[RevenueCat] configure failed:', getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    void configure();
  }, []);

  // Identify user with Supabase id; reset on logout
  useEffect(() => {
    if (!authReady || !isConfigured) return;

    const syncIdentity = async () => {
      try {
        setIsLoading(true);

        if (user?.id) {
          if (lastAppUserIdRef.current !== user.id) {
            const { customerInfo: info } = await Purchases.logIn(user.id);
            lastAppUserIdRef.current = user.id;
            setCustomerInfo(info);
          } else {
            await refreshCustomerInfo();
          }
          await refreshOfferings();
        } else if (lastAppUserIdRef.current) {
          const info = await Purchases.logOut();
          lastAppUserIdRef.current = null;
          setCustomerInfo(info);
          setOfferings(null);
        } else {
          await refreshCustomerInfo();
          await refreshOfferings();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[RevenueCat] identity sync failed:', getErrorMessage(error));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void syncIdentity();
  }, [authReady, isConfigured, user?.id, refreshCustomerInfo, refreshOfferings]);

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      Alert.alert('Unavailable', 'Subscriptions are not available in this build yet.');
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });

      await refreshCustomerInfo();

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          return true;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.NOT_PRESENTED:
          return false;
        case PAYWALL_RESULT.ERROR:
        default:
          Alert.alert('Purchase error', 'Could not complete the purchase. Please try again.');
          return false;
      }
    } catch (error) {
      Alert.alert('Purchase error', getErrorMessage(error));
      return false;
    }
  }, [isConfigured, refreshCustomerInfo]);

  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      Alert.alert('Unavailable', 'Subscriptions are not available in this build yet.');
      return false;
    }

    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
        displayCloseButton: true,
      });

      await refreshCustomerInfo();

      return (
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        result === PAYWALL_RESULT.NOT_PRESENTED
      );
    } catch (error) {
      Alert.alert('Purchase error', getErrorMessage(error));
      return false;
    }
  }, [isConfigured, refreshCustomerInfo]);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    if (!isConfigured) {
      Alert.alert('Unavailable', 'Subscription management is not available in this build yet.');
      return;
    }

    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo: info }) => {
            setCustomerInfo(info);
          },
          onRestoreFailed: ({ error }) => {
            Alert.alert('Restore failed', getErrorMessage(error));
          },
        },
      });
      await refreshCustomerInfo();
    } catch (error) {
      Alert.alert('Customer Center', getErrorMessage(error));
    }
  }, [isConfigured, refreshCustomerInfo]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) {
      Alert.alert('Unavailable', 'Restore is not available in this build yet.');
      return false;
    }

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      if (hasProEntitlement(info)) {
        Alert.alert('Restored', 'Your Mindful Moves Pro access has been restored.');
        return true;
      }

      Alert.alert('No purchases found', 'We could not find an active subscription for this Apple ID.');
      return false;
    } catch (error) {
      Alert.alert('Restore failed', getErrorMessage(error));
      return false;
    }
  }, [isConfigured]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (!isConfigured) return false;

      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        setCustomerInfo(info);
        return hasProEntitlement(info);
      } catch (error) {
        const message = getErrorMessage(error).toLowerCase();
        if (message.includes('cancelled') || message.includes('canceled')) {
          return false;
        }
        Alert.alert('Purchase failed', getErrorMessage(error));
        return false;
      }
    },
    [isConfigured]
  );

  const value = useMemo<SubscriptionContextType>(
    () => ({
      isConfigured,
      isLoading,
      isPro: hasProEntitlement(customerInfo),
      customerInfo,
      offerings,
      entitlementId: ENTITLEMENT_ID,
      refreshCustomerInfo,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
      restorePurchases,
      purchasePackage,
    }),
    [
      isConfigured,
      isLoading,
      customerInfo,
      offerings,
      refreshCustomerInfo,
      presentPaywall,
      presentPaywallIfNeeded,
      presentCustomerCenter,
      restorePurchases,
      purchasePackage,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
