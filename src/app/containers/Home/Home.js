import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import * as Neoscan from '../../utils/api/neoscan'

import { getAccountName, validateLength } from '../../utils/api/neon'

import AccountInfo from '../../components/AccountInfo'
import RenameAccount from '../../components/RenameAccount'
import TransactionList from '../../components/TransactionList'

import * as string from '../../utils/string'

import Asset from '../Asset'

import style from './Home.css'

class Home extends Component {
  constructor(props) {
    super(props)

    const { account, accounts } = this.props

    this.state = {
      showInputField: false,
      transactionHistoryError: '',
      label: getAccountName(account, accounts),
      labelError: '',
      amountsError: '',
    }
  }

  componentDidMount() {
    const { selectedNetworkId } = this.props

    this.getHomeScreenTransactions(selectedNetworkId)
    this.getHomeScreenBalance(selectedNetworkId)
  }

  getHomeScreenBalance = network => {
    const { account, accountActions } = this.props
    this.setState({ amountsError: '' }, () => {
      Neoscan.setNet(network)
      Neoscan.getBalance(account.address)
        .then(results => accountActions.setBalance(results))
        .catch(() => this.setState({ amountsError: 'Could not retrieve amounts.' }))
    })
  }

  getHomeScreenTransactions = network => {
    const { account, accountActions } = this.props

    let page = 1 // TODO add 'more' feature to list more txs

    this.setState({ transactionHistoryError: '' }, () => {
      Neoscan.get_address_abstracts(account.address, page)
        .then(results => {
          if (results && results.data) {
            let totalPages = results.data.total_pages
            let pageSize = results.data.page_size
            let pageNumber = results.data.page_number
            let totalTxs = results.data.total_entries
            let txs = {}
            txs.address = account.address
            txs.data = []
            txs.total = totalTxs
            txs.viewing = 'Viewing ' + pageSize + ' of ' + totalTxs + ' transactions on Page ' + pageNumber + ' of ' + totalPages

            if (results.data && results.data.entries) {
              accountActions.setTransactions({})
              return results.data.entries.map(tx => {
                return Neoscan.get_transaction(tx.txid).then(txDetail => {
                  txDetail.stringRemarks = []

                  txDetail.attributes.map((remark, i) => {
                    if (remark.usage === 'Remark') {
                      let s = string.hexstring2str(remark.data)
                      txDetail.stringRemarks.push(s)
                    }
                  })

                  txDetail.txTime = new Date(txDetail.time * 1000).toLocaleString()
                  txs.data.push(txDetail)
                  accountActions.setTransactions(txs)
                })
              })
            }
          }
        })
        .catch(() =>
          this.setState({
            transactionHistoryError: 'Could not retrieve transactions.',
          })
        )
    })
  }

  handleRenameButtonFormSubmit = e => {
    e.preventDefault()
    const { walletActions, account } = this.props

    if (validateLength(this.state.label, 3)) {
      walletActions.changeLabel({ address: account.address, label: this.state.label })
      this.setState({ showInputField: false })
    } else {
      this.setState({ labelError: 'Label must be longer than 3 characters.' })
    }
  }

  handleInputChange = e => {
    this.setState({ labelError: '' })
    this.setState({ label: e.target.value })
  }

  showInputField = () => {
    this.setState({ showInputField: true })
  }

  render() {
    const { account, selectedNetworkId } = this.props
    const { showInputField, amountsError, label, transactionHistoryError, labelError } = this.state

    let assets = []
    if (account.results) {
      for (let key in account.results) {
        if (account.results.hasOwnProperty(key)) {
          if (key !== 'neo' && key !== 'gas') {
            assets.push(<Asset assetName={ key } assetAmount={ account.results[key].toLocaleString() } key={ key } />)
          }
        }
      }
    }

    return (
      <Fragment>
        <section className={ style.accountInfoWrapper }>
          <section className={ style.accountInfoContainer }>
            {showInputField ? (
              <RenameAccount
                accountName={ label }
                onSubmitHandler={ this.handleRenameButtonFormSubmit }
                onChangeHandler={ this.handleInputChange }
                labelError={ labelError }
              />
            ) : (
              <AccountInfo
                onClickHandler={ this.showInputField }
                neo={ Number(account.neo) }
                gas={ Number(account.gas) }
                label={ label }
                address={ account.address }
                amountsError={ amountsError }
                getBalance={ () => this.getHomeScreenBalance(selectedNetworkId) }
                network={ selectedNetworkId }
                showOptions
              />
            )}
          </section>
        </section>
        <section className={ style.transactionInfo }>
          <h2 className={ style.assetsInfoHeader }>Other Assets</h2>
          <div>
            {assets}
          </div>
        </section>
        <section className={ style.transactionInfo }>
          <h2 className={ style.transactionInfoHeader }>Transactions</h2>
          <TransactionList
            transactions={ account.transactions || {} }
            transactionHistoryError={ transactionHistoryError }
            getTransactions={ () => this.getHomeScreenTransactions(selectedNetworkId) }
          />
        </section>
      </Fragment>
    )
  }
}

export default Home

Home.propTypes = {
  walletActions: PropTypes.object.isRequired,
  selectedNetworkId: PropTypes.string.isRequired,
  account: PropTypes.object.isRequired,
  accountActions: PropTypes.object,
  accounts: PropTypes.object.isRequired,
}
