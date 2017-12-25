import React, {Component} from 'react'
import {connect} from 'react-redux'
import {api} from '@cityofzion/neon-js'
import style from './Transactions.css'
import Button from 'preact-material-components/Button'
import 'preact-material-components/Button/style.css'
import 'preact-material-components/Theme/style.css'
import TextField from 'preact-material-components/TextField'
import 'preact-material-components/TextField/style.css'

@connect(
	state => ({
		network: state.network
	})
)

export default class Transactions extends Component {
	state = {
		errorMsg: '',
		loading: false,
		transactions: [],
		address: '',
		enteredAddress: ''
	}

	_handleTextFieldChange = (e) => {
		const key = e.target.id
		this.setState({
			[key]: e.target.value
		})
	}

	handleSubmit = (event) => {
		event.preventDefault()
		const {network} = this.props
		this.setState({
			loading: true,
      transactions: [],
			errorMsg: '',
			address: ''
		})
		api.neonDB.getTransactionHistory(network.name, this.state.enteredAddress)
			.then((result) => {
				this.setState({
					loading: false,
					transactions: result,
					address: this.state.enteredAddress
				})
			})
			.catch((e) => {
				this.setState({loading: false, errorMessage: 'Could not retrieve the transactions for this address.'})
			})
	}

	renderTransactions(transactions) {
		const listItems = transactions.map((transaction) =>
			<li>
				<div className={style.transactionId}>{transaction.txid}</div>
				<div>NEO transferred: {transaction.NEO}</div>
				<div>GAS transferred: {transaction.GAS}</div>
			</li>
		)
		return (
			<ul>{listItems}</ul>
		)
	}

	render() {
		const {transactions, address, errorMsg, loading} = this.state

		return (
			<div className='content'>
				<form onSubmit={this.handleSubmit}>
					<TextField
						autoFocus
						type='text'
						placeholder='Address'
						value={this.state.enteredAddress}
						id="enteredAddress"
						onChange={this._handleTextFieldChange}
					/>
					<Button raised ripple>List</Button>
				</form>
				{address && transactions.length > 0 &&
				(
					<div>
						<div>Results for: {address}</div>
						{this.renderTransactions(transactions)}
					</div>
				)
				}
				{address && !transactions.length &&
				(
					<div>
						<div>Results for: {address}</div>
						None
					</div>
				)
				}
				{loading === true &&
				<div>loading...</div>
				}
				{errorMsg !== '' &&
				<div>ERROR: {errorMsg}</div>
				}
			</div>
		)
	}
}
