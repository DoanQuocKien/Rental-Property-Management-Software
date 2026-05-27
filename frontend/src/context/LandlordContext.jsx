import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

const LandlordContext = createContext();

/**
 * LandlordProvider - Manages landlord-specific data including settings
 * Provides shared data to all landlord-related components
 */
export function LandlordProvider({ children }) {
  const { user, token } = useAuth();
  const [landlordData, setLandlordData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch landlord profile + settings on mount or when user/token changes
   */
  useEffect(() => {
    if (!user || user.role !== 'landlord' || !token) {
      setLoading(false);
      return;
    }

    const fetchLandlordData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from new endpoint first
        try {
          const res = await api.get('/landlord/profile');

          if (res.data?.data) {
            setLandlordData(res.data.data.user);
            setSettings(res.data.data.settings);
          }
        } catch (profileErr) {
          // Fallback: if endpoint doesn't exist, set user from context
          console.warn('Endpoint /landlord/profile not available, using fallback');
          setLandlordData(user);

          // Try to fetch settings separately
          try {
            const settingsRes = await api.get('/landlord/settings');
            if (settingsRes.data?.data) {
              setSettings(settingsRes.data.data);
            }
          } catch (settingsErr) {
            console.warn('Could not fetch settings:', settingsErr.message);
            // Set empty settings object
            setSettings({
              electricity_price: 0,
              water_price: 0,
              wifi_price: 0,
              garbage_price: 0,
              parking_price: 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch landlord data:', err);
        setError(err.response?.data?.message || 'Failed to load landlord data');
      } finally {
        setLoading(false);
      }
    };

    fetchLandlordData();
  }, [user, token]);

  /**
   * Refresh settings after they've been updated
   * Call this after user modifies settings in Settings page
   */
  const refreshSettings = async () => {
    try {
      const res = await api.get('/landlord/settings');
      if (res.data?.data) {
        setSettings(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to refresh settings:', err);
      throw err;
    }
  };

  /**
   * Get default prices from settings for form initialization
   * Fallback to 0 if not configured
   */
  const getDefaultPrices = () => ({
    electricity_price: settings?.electricity_price || 0,
    water_price: settings?.water_price || 0,
    wifi_price: settings?.wifi_price || 0,
    garbage_price: settings?.garbage_price || 0,
    parking_price: settings?.parking_price || 0,
  });

  /**
   * Get landlord contact info for auto-fill
   */
  const getLandlordContactInfo = () => ({
    name: landlordData?.full_name || landlordData?.name || '',
    email: landlordData?.email || '',
    phone: landlordData?.phone_number || '',
    citizenId: landlordData?.citizen_id || '',
    address: landlordData?.permanent_address || '',
  });

  const value = {
    landlordData,
    settings,
    loading,
    error,
    refreshSettings,
    getDefaultPrices,
    getLandlordContactInfo,
  };

  return (
    <LandlordContext.Provider value={value}>
      {children}
    </LandlordContext.Provider>
  );
}

/**
 * Hook to use LandlordContext
 * Throws error if used outside LandlordProvider
 */
export function useLandlordData() {
  const context = useContext(LandlordContext);
  if (!context) {
    throw new Error('useLandlordData must be used within LandlordProvider');
  }
  return context;
}
