import React from 'react'
import Futureprice from './future-price'
import TradingView from './trading-view'
import OrderPanel from './order-panel'
import TransferModal from '../modals/TransferModal'

const Main:React.FC = () => {
  return (
    <div>
      <Futureprice />
      <TradingView />
      <OrderPanel />
      <TransferModal />
    </div>
  )
}

export default Main
