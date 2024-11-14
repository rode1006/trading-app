import React, { createContext, ReactNode, useState } from "react";

interface TradingContextType {
  selectedBalance: string;
  setSelectedBalance: (selectedBalance: string) => void;
  transferModalVisible: boolean;
  setTransferModalVisible: (transferModalVisible: boolean) => void;
}

export const TradingContext = createContext<TradingContextType | undefined>(
  undefined
);

const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedBalance, setSelectedBalance] = useState<string>("Futures");
  const [transferModalVisible, setTransferModalVisible] = useState<boolean>(false)

  return (
    <TradingContext.Provider value={{ selectedBalance, setSelectedBalance, setTransferModalVisible, transferModalVisible }}>
      {children}
    </TradingContext.Provider>
  );
};

export default TradingProvider;
