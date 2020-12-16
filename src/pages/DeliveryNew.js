import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import { Form, Button, Message, Input } from 'semantic-ui-react';
import factory from '../ethereum/factory';
import web3 from '../ethereum/web3';
import variables from '../ethereum/variables';

const bigInt = require("big-integer");

class DeliveryNew extends Component {
  state = {
    receiver: '',
    message: '',
    term: '',
    deposit: '',
    loading: false,
    errorMessage: ''
  };

  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: '' });

    try {
        let m1, m2;
        
        // p, g of ElGamal algorithm
        let p = bigInt(variables.p.substr(2), 16)
        let g = bigInt(variables.g.substr(2), 16)
        // Random number r
        //let r = bigInt.randBetween(2, p.minus(1)); este sería el correcto, por ahora usamos r de variables

        let r = bigInt(variables.r.substr(2),16)

        // ya public key of A
        let ya = bigInt(variables.ya.substr(2), 16)
        //xa private key of A
        //let xa = bigInt(variables.xa.substr(2),16)
        
        let messageSentBuffer = Buffer.from(this.state.message, 'utf8');
        let messageSent = bigInt(messageSentBuffer.toString('hex'), 16);

        // Generation of M1 = g^r mod p
        m1 = g.modPow(r, p);

        // Generation of M2 = m·ya^r mod p
        m2 = messageSent.multiply(ya.modPow(r, p));
        
        const accounts = await web3.eth.getAccounts();
        await factory.methods
            .createDelivery(this.state.receiver, "0x"+m1.toString(16), "0x"+m2.toString(16),
              "0x"+ya.toString(16), "0x"+g.toString(16), "0x"+p.toString(16), this.state.term
              )
            .send({ from: accounts[0], value: this.state.deposit });

          
        alert('¡Contrato creado!');
        // Refresh, using withRouter
        this.props.history.push('/');
    } catch (err) {
        this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }

  };

  render() {
    return (
      <div>
        <Link to='/'>Atrás</Link>
        <h3>Generar contrato</h3>
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Receptor del contrato</label>
            <Input
              value={this.state.receiver}
              onChange={event => this.setState({ receiver: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Contenido del contrato</label>
            <Input
              value={this.state.message}
              onChange={event => this.setState({ message: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Tiempo límite para firmar el contrato </label>
            <Input
              label="segundos"
              labelPosition="right"
              value={this.state.term}
              onChange={event => this.setState({ term: event.target.value })}
            />
          </Form.Field>

          <Form.Field>
            <label>Deposito</label>
            <Input
              label="wei"
              labelPosition="right"
              value={this.state.deposit}
              onChange={event => this.setState({ deposit: event.target.value })}
            />
          </Form.Field>

          <Message error header="ERROR" content={this.state.errorMessage} />
          <Button   color="green"      loading={this.state.loading}>
            ¡Enviar!
          </Button>
        </Form>
      </div>
    );
  }
}
                
export default withRouter(DeliveryNew);
