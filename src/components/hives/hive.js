import React, { useEffect, useState } from 'react';
import CountDown from '../utils/countDown';

import './hive.scss';
import { withRouter } from 'react-router-dom';
import Store from '../../stores/store';
const { store } = Store;

const Hive = (props) => {
  // console.log(props.token?.ethPrice);
  const address = `${props.address.substring(0, 5)}...${props.address.substring(
    props.address.length - 4,
    props.address.length
  )}`;

  const [stakedAmountUsd, setStakedAmountUsd] = useState(props.stakedBalance);
  const [totalLockVolume, setTotalLockVolume] = useState(0);

  const initTotalLockVolume = async () => {
    if (!!props.token.disableStake) return;
    const eth = store
      .getStore('exchangeAssets')
      .tokens.find((e) => e.label === 'ETH');
    const token = store
      .getStore('exchangeAssets')
      .tokens.find(
        ({ liquidityPoolAddress }) =>
          props.token.address == liquidityPoolAddress
      );
    const amountOut = await store.getAmountOut(token, eth, '1');
    const ethPrice = await store.getETHPrice();
    const totalSupply = await store.getTotalSupply(props.token);
    const totalLockVolume = amountOut * ethPrice * totalSupply;
    setTotalLockVolume(totalLockVolume);
  };
  useEffect(() => {
    initTotalLockVolume();
  }, []);

  function navigateStake(token) {
    store.setStore({ currentPool: token });
    props.history.push('/stake/' + props.address);
  }

  const assetIn = store.getStore('poolInTokens').find((i) => i.label == 'ETH');

  const getStakedAmountUsd = async () => {
    try {
      const assetOut = store
        .getStore('exchangeAssets')
        .tokens.find(
          ({ liquidityPoolAddress }) =>
            props.token.address == liquidityPoolAddress
        );

      if (assetOut && props.stakedBalance) {
        let ethUnitPrice = await store.getLpAmountOut(assetIn, assetOut, `1`);
        let coinEthRelation = ethUnitPrice / props.stakedBalance;
        let ethStakedPrice = 1 / coinEthRelation;
        let stakedAmountUsd = ethStakedPrice * props.token?.ethPrice;
        // let ethUnitPrice = await store.getAmountOut(assetIn, assetOut, `1`);
        // console.log(stakedAmountUsd, ethUnitPrice, props.name);
        // console.log(assetOut);
        return setStakedAmountUsd((+stakedAmountUsd).toFixed(3));
      }
      setStakedAmountUsd(0);
    } catch (error) {
      // console.log(error);
      throw error;
    }
  };

  useEffect(() => {
    getStakedAmountUsd();
  }, [props]);

  return (
    <div className='hive-wrapper card'>
      <div className='card-body'>
        <div className='hive-header'>
          <div>
            <div className='hive-logo'>
              <img
                alt=''
                className='hive-image'
                src={require(`../../assets/logos/${props.symbol}.png`)}
              />
            </div>
            <div className='main-blue'>{props.name}</div>
            <a
              href={'https://etherscan.io/address/' + props.address}
              className='address'
              target='_blank'
            >
              {address}
            </a>
          </div>
        </div>
        <br />

        <div className='hive-details'>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot green'></span>
              Beast Bonus (leverage)
            </div>
            <div className='text-right main-blue'>{props.beastBonus * 10}%</div>
          </div>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot yellow'></span>
              Beast Bonus -100% reduction in
            </div>
            <div className='text-right main-blue'>
              <CountDown pool={props.token} />
            </div>
          </div>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot purple'></span>
              Weekly Rewards
            </div>
            <div className='text-right main-blue'>
              {props.weeklyRewards?.toFixed(4) || 0} {props.rewardsSymbol}
            </div>
          </div>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot purple'></span>
              Lockup Time
            </div>
            <div className='text-right main-blue'>
              {props.address == '0x9411aE40e4EefE2BDCF6F4e2beC81BEb7682bC63'
                ? '2'
                : '12'}{' '}
              months
            </div>
          </div>
          {totalLockVolume ? (
            <div className='d-flex justify-content-between'>
              <div>
                <span className='dot orange'></span>
                Total lock volume
              </div>
              <div className='text-right main-blue'>
                {totalLockVolume.toLocaleString()} USD
              </div>
            </div>
          ) : (
            ''
          )}
          <hr />
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot yellow'></span>
              My staked amount
            </div>
            <div className='text-right main-blue'>
              {props.stakedBalance?.toFixed(6) || 0} {props.symbol}
            </div>
          </div>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot yellow'></span>
              My staked value (USD)
            </div>
            <div className='text-right main-blue'>
              {stakedAmountUsd || '0'} USD
            </div>
          </div>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot light-blue'></span>
              My Beast Mode (leverage)
            </div>
            <div className='text-right main-blue'>
              {props.myBeastModes * 10}%
            </div>
          </div>
          <div className='d-flex justify-content-between'>
            <div>
              <span className='dot orange'></span>
              My Rewards
            </div>
            <div className='text-right main-blue'>
              {props.myRewards.toFixed(4)} {props.rewardsSymbol}
            </div>
          </div>

          <div className='text-center pt-4'>
            <button
              type='button'
              onClick={() => {
                if (props.id !== 'balancer-pool') {
                  navigateStake(props.token);
                }
              }}
              className='btn btn-primary bg-main-blue main-btn btn-block'
            >
              View
            </button>
            <button
              type='button'
              onClick={() => {
                // if (props.token.name == 'WPE-LP')
                //   return window.open(props.token.liquidityLink);

                if (!props.token.disableStake)
                  return props.history.push('/pools/' + props.token.address);
                // if (props.id !== 'balancer-pool') {
                //   navigateStake(props.token);
                // }
              }}
              className={
                props.token.disableStake
                  ? 'btn btn-secondary bg-main-blue main-btn btn-block disabled'
                  : 'btn btn-primary bg-main-blue main-btn btn-block'
              }
            >
              Add liquidity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRouter(Hive);
