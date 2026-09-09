import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBattery, saveBattery } from '../storage/storage';

const BatteryContext = createContext({
  batteryPercentage: 84,
  updateBattery: async () => {},
  isModalVisible: false,
  openBatteryModal: () => {},
  closeBatteryModal: () => {},
});

export function BatteryProvider({ children }) {
  const [batteryPercentage, setBatteryPercentage] = useState(84);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const val = await getBattery();
        if (isMounted && typeof val === 'number') {
          setBatteryPercentage(val);
        }
      } catch (e) {
        console.error('Error loading battery in context:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateBattery = async (newVal) => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(newVal) || 0)));
    setBatteryPercentage(clamped);
    await saveBattery(clamped);
    return clamped;
  };

  const openBatteryModal = () => setIsModalVisible(true);
  const closeBatteryModal = () => setIsModalVisible(false);

  return (
    <BatteryContext.Provider
      value={{
        batteryPercentage,
        updateBattery,
        isModalVisible,
        openBatteryModal,
        closeBatteryModal,
      }}
    >
      {children}
    </BatteryContext.Provider>
  );
}

export function useBattery() {
  return useContext(BatteryContext);
}

export default BatteryContext;
