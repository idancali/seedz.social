import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { Typography, TextField, InputAdornment } from '@material-ui/core';

import Loader from '../loader/loader';
import Snackbar from '../snackbar/snackbar';

import Store from '../../stores/store';

import { Col, Row, Card } from 'react-bootstrap';
import StakeMain from './stakemain';
import StakeBuyBoost from './stakeBuyBoost';

import {
  ERROR,
  STAKE,
  STAKE_RETURNED,
  WITHDRAW,
  WITHDRAW_RETURNED,
  GET_REWARDS,
  GET_REWARDS_RETURNED,
  EXIT,
  EXIT_RETURNED,
  GET_BALANCES_RETURNED,
  BOOST_STAKE,
} from '../../constants';
import rewardsMapper from '../utils/rewardsMapper';
import styles from './stakeStyles';

const setState = (params) => {
  console.log('set state params', params);
};

const { emitter, dispatcher, store } = Store;

const Stake = (props) => {
  const address = props.match.params.address;

  const [account, setAccount] = useState(store.getStore('account'));
  const [themeType, setThemeType] = useState(store.getStore('themeType'));

  const [rewardPools, setRewardPools] = useState(
    rewardsMapper(store.getStore('rewardPools'))
  );

  const getPool = () => rewardPools.find((p) => p.address === address);

  const [pool, setPool] = useState(getPool());

  console.log('pool ------------', pool);

  const [stakevalue, setStakeValue] = useState('main');
  const [balanceValid, setBalanceValid] = useState(false); // not used
  const [loading, setLoading] = useState(!(account && pool));
  const [value, setValue] = useState('options'); // switchea buyboost y options para el render
  const [voteLockValid, setVoteLockValid] = useState(false); // not used
  const [voteLock, setVoteLock] = useState(null); // not used
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [snackbarType, setSnackbarType] = useState(null); // not used
  const [activeClass, setActiveClass] = useState(store.getStore('activeClass')); // not used
  const [amountStakeError, setAmountStakeError] = useState(false);
  const [fieldId, setFieldId] = useState('');
  // const [amount, setAmount2] = useState('');
  const [amounts, setAmounts] = useState({});
  const [amountError, setAmountError] = useState(false);

  useEffect(() => {
    if (!pool) props.history.push('/');
  }, []);

  useEffect(() => {
    store.getStore('currentPool');

    emitter.on(ERROR, errorReturned);
    emitter.on(STAKE_RETURNED, showHash);
    emitter.on(WITHDRAW_RETURNED, showHash);
    emitter.on(EXIT_RETURNED, showHash);
    emitter.on(GET_REWARDS_RETURNED, showHash);
    emitter.on(GET_BALANCES_RETURNED, balancesReturned);

    return () => {
      emitter.removeListener(ERROR, errorReturned);
      emitter.removeListener(STAKE_RETURNED, showHash);
      emitter.removeListener(WITHDRAW_RETURNED, showHash);
      emitter.removeListener(EXIT_RETURNED, showHash);
      emitter.removeListener(GET_REWARDS_RETURNED, showHash);
      emitter.removeListener(GET_BALANCES_RETURNED, balancesReturned);
    };
  }, []);

  const balancesReturned = () => {
    const currentPool = store.getStore('currentPool');
    console.log('CURRENT POOL ' + currentPool);
    const pools = store.getStore('rewardPools');
    let newPool = pools.filter((pool) => {
      return pool.id === currentPool.id;
    });

    if (newPool.length > 0) {
      newPool = newPool[0];
      store.setStore({ currentPool: newPool });
    }
  };

  const showHash = (txHash) => {
    setSnackbarType(null);
    setSnackbarMessage(null);
    setLoading(false);

    setTimeout(() => {
      setSnackbarMessage(txHash);
      setSnackbarType('Hash');
    });
  };

  const errorReturned = (error) => {
    console.log('error returned', error);
    setSnackbarMessage(null);
    setSnackbarType(null);
    setLoading(false);

    setTimeout(() => {
      setSnackbarMessage(error.toString());
      setSnackbarType('Error');
    });
  };

  const validateBoost = () => {
    if (pool.costBooster > pool.boostBalance) {
      emitter.emit(ERROR, 'insufficient funds to activate Beast Mode');
    } else if (pool.timeToNextBoost - new Date().getTime() / 1000 > 0) {
      emitter.emit(ERROR, 'Too soon to activate BEAST Mode again');
    } else {
      onBuyBoost();
    }
  };

  // not used
  // const overlayClicked = () => {
  //   setState({ modalOpen: true });
  // };

  // not used
  // const closeModal = () => {
  //   setState({ modalOpen: false });
  // };

  const onBuyBoost = () => {
    setAmountError(false);
    const tokens = pool.tokens;
    const selectedToken = tokens[0];
    const amount = amounts[selectedToken.id + '_stake'];
    const value = (selectedToken.costBooster + 0.0001).toFixed(10).toString();

    setLoading(true);
    dispatcher.dispatch({
      type: BOOST_STAKE,
      content: { asset: pool.token, amount, value },
    });
  };

  const onClaim = () => {
    setLoading(true);
    dispatcher.dispatch({
      type: GET_REWARDS,
      content: { asset: pool.token },
    });
  };

  const onStake = () => {
    console.log('staking ------------');
    setAmountError(false);
    setAmountStakeError(false);
    const selectedToken = pool.token;
    setFieldId('');
    const amount = amounts[selectedToken.id + '_stake'];
    if (amount > 0) {
      this.setState({ loading: true });
      dispatcher.dispatch({
        type: STAKE,
        content: { asset: pool.token, amount },
      });
    } else {
      setFieldId(selectedToken.id + '_stake');
      setAmountStakeError(true);
      emitter.emit(ERROR, 'Please enter the amount on the Stake field');
    }
  };

  const onUnstake = () => {
    console.log('unstaking ------------');
    setAmountError(false);
    setAmountStakeError(false);
    setFieldId('');
    const amount = amounts[pool.id + '_unstake'];
    console.log(amounts);
    console.log('unstaking ------------', 0.000001);
    if (amount > 0) {
      setLoading(true);
      dispatcher.dispatch({
        type: WITHDRAW,
        content: { asset: pool.token, amount },
      });
    } else {
      setFieldId(`${pool.id}_unstake`);
      setAmountStakeError(true);
      emitter.emit(ERROR, 'Please enter the amount on the Un-Stake field');
    }
  };

  const onExit = () => {
    setLoading(true);
    dispatcher.dispatch({ type: EXIT, content: { asset: pool.token } });
  };

  const renderAssetInput = (pool, type) => {
    const { classes } = props;
    const amount = amounts[pool.id + '_' + type];
    const action = type === 'unstake' ? onUnstake : onStake;
    let amountError = amounts[pool.id + '_' + type + '_error'];
    return (
      <div className={classes.valContainer} key={pool.id + '_' + type}>
        <Row>
          <Col lg='8' md='8' sm='10' xs='12'>
            {type === 'stake' && (
              <Typography
                onClick={() => {
                  setAmount(
                    pool.id,
                    type,
                    pool
                      ? (
                          Math.floor(pool.balance * 1000000000) / 1000000000
                        ).toFixed(9)
                      : 0
                  );
                }}
                className='pool-max-balance text-right'
              >
                Use Max Balance
              </Typography>
            )}
            {type === 'unstake' && (
              <Typography
                onClick={() => {
                  setAmount(
                    pool.id,
                    type,
                    pool
                      ? (
                          Math.floor(pool.stakedBalance * 1000000000) /
                          1000000000
                        ).toFixed(9)
                      : 0
                  );
                }}
                className='pool-max-balance text-right'
              >
                {'Use Max Balance'}
              </Typography>
            )}
          </Col>
        </Row>
        <Row>
          <Col lg='8' md='12' sm='12' xs='12'>
            <TextField
              disabled={loading}
              className={
                amountStakeError && fieldId === pool.id + '_' + type
                  ? 'border-btn-error mb-1'
                  : 'border-btn mb-1'
              }
              // inputRef={(input) =>
              //   input &&
              //   fieldId === pool.id + '_' + type &&
              //   amountStakeError &&
              //   input.focus()
              // }
              id={`${pool.id}_${type}`}
              value={amount}
              error={amountError}
              onChange={onChange}
              placeholder='0.0000000'
              InputProps={{
                endAdornment: (
                  <InputAdornment>
                    <Typography variant='h6'>{pool.symbol}</Typography>
                  </InputAdornment>
                ),
                startAdornment: (
                  <InputAdornment
                    position='end'
                    className={classes.inputAdornment}
                  >
                    <div className={classes.assetIcon}>
                      <img
                        alt=''
                        src={require('../../assets/' +
                          pool.symbol +
                          '-logo.png')}
                        height='30px'
                      />
                    </div>
                  </InputAdornment>
                ),
              }}
            />
          </Col>

          <Col className='text-center'>
            <div
              className={
                'pool-' +
                type +
                '-button d-flex align-items-center justify-content-center'
              }
              onClick={action}
            >
              {type} --
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const onChange = (event) => {
    console.log('onchange ------------', event.target.value);
    console.log('current amounts ------------', amounts);
    console.log('event.target.id', event.target.id);
    let newAmount = {};
    newAmount[event.target.id] = event.target.value;
    console.log('newamount ------------', newAmount);
    setAmountStakeError(false);
    setAmounts({ ...amounts, ...newAmount });
  };

  const setAmount = (id, type, balance) => {
    const rounded = (
      Math.floor((balance === '' ? '0' : balance) * 1000000000) / 1000000000
    ).toFixed(9);
    let amount = [];
    amount[id + '_' + type] = rounded;

    console.log('amounts --------', amounts);
    setAmounts(amount);
  };

  const stakeHeader = (params) => {
    return (
      <Row>
        <Col lg='2' md='2' xs='6' className='text-left'>
          <img
            className='pool-logo'
            alt=''
            src={require('../../assets/BPT.png')}
          />
        </Col>
        <Col lg='10' md='10' xs='6' className='text-left pool-header'>
          <div className='text-left'>
            <div className='text-purple pool-name'>{pool.name}</div>
            <a
              href={'https://etherscan.io/address/' + pool.address}
              rel='noopener noreferrer'
              target='_blank'
              className='text-purple'
            >
              {pool.address}
            </a>
          </div>
        </Col>
      </Row>
    );
  };

  const mainRender = () => {
    return (
      <>
        {stakevalue === 'main' && (
          <StakeMain
            renderAssetInput={renderAssetInput}
            pool={pool}
            onExit={onExit}
            onClaim={onClaim}
            navigateInternal={setValue}
          />
        )}
      </>
    );
  };

  return (
    <>
      <div className='info-header'></div>
      <div className='info-header-down'></div>

      <div className='p-5 ml-5 text-center '>
        <div className='p-5 ml-5 text-center '>
          {stakeHeader()}
          {value === 'options' && mainRender()}
          {value === 'buyboost' && (
            <StakeBuyBoost validateBoost={validateBoost} pool={pool} />
          )}

          {snackbarMessage && (
            <Snackbar
              type={snackbarType}
              message={snackbarMessage}
              open={true}
            />
          )}
          {loading && <Loader />}
        </div>
      </div>
    </>
  );
};

export default withRouter(withStyles(styles)(Stake));
