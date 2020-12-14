import React, { Component } from 'react';
import { withRouter, Link } from "react-router-dom";
import { Form, Button, Message, Input, Dimmer, Loader, Label } from 'semantic-ui-react';
import notification from '../ethereum/notification';
import web3 from '../ethereum/web3';
import variables from '../ethereum/variables';

const bigInt = require("big-integer");
const dateFormat = require('dateformat');

class DeliveryShow extends Component {
  state = {
    address: '',
    sender: '',
    receiver: '',
    state: '',
    g: '',
    p: '',
    c1: '',
    c2: '',
    ya: '',
    term: '',
    start: '',
    z1: '',
    z2: '',
    yb: '',
    c: '',
    w: '',
    message: '',
    deposit: '',
    loading: false,
    errorMessage: ''
  };

  componentDidMount = async () => {

    this.setState({ loading: true, errorMessage: '' });

    try {
      let address = this.props.match.params.address;
      let deliveryContract = notification(address);

      let deposit = await web3.eth.getBalance(address)

      let sender = await deliveryContract.methods.sender().call();
      let receiver = await deliveryContract.methods.receiver().call();
      let state = await deliveryContract.methods.getState(address).call();
      let g = await deliveryContract.methods.g().call();
      let p = await deliveryContract.methods.p().call();
      let c1 = await deliveryContract.methods.c1().call();
      let c2 = await deliveryContract.methods.c2().call();
      let ya = await deliveryContract.methods.ya().call();
      let term = await deliveryContract.methods.term().call();
      let start = await deliveryContract.methods.start().call();
      let z1 = await deliveryContract.methods.z1().call();
      let z2 = await deliveryContract.methods.z2().call();
      let yb = await deliveryContract.methods.yb().call();
      let c = await deliveryContract.methods.c().call();
      let w = await deliveryContract.methods.w().call();
      let message = '';

      let d = new Date(0);
      d.setUTCSeconds(start);
      start = dateFormat(d, "dd/mm/yyyy HH:MM");

      // Calcular MESSAGE
      if (w) {
        // TODO: El sender no té Xb
        let xb = bigInt(variables.xb.substr(2), 16);

        let wBig = bigInt(w.substr(2), 16);
        let cBig = bigInt(c.substr(2), 16);
        let pBig = bigInt(p.substr(2), 16);
        let c2Big = bigInt(c2.substr(2), 16);
        let yaBig = bigInt(ya.substr(2), 16);
        
        let r = wBig.subtract(cBig.multiply(xb.mod(pBig)));  // r = w-c*xb mod q

        const messageReceived = c2Big.divide(yaBig.modPow(r, pBig));
        message = Buffer.from(messageReceived.toString(16), 'hex');
      }

      this.setState({ 
        address: address,
        sender: sender,
        receiver: receiver,
        state: state,
        g: g,
        p: p,
        c1: c1,
        c2: c2,
        ya: ya,
        term: term,
        start: start,
        z1: z1,
        z2: z2,
        yb: yb,
        c: c,
        w: w,
        message: message,
        deposit: deposit
      });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  onSubmit = async event => {
    event.preventDefault();

    // Refresh, using withRouter
    this.props.history.push('/');
  };

  render() {
    return (
      <div>
        <Dimmer inverted active={this.state.loading}>
          <Loader inverted content='Loading...'></Loader>
        </Dimmer>
        <Link to='/'>Atrás</Link>
        <h3>Vista del contrato</h3>
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage} hidden={this.state.loading}>
          <Form.Field>
            <label>Dirección del Smart Contract</label>
            <Input
              readOnly
              value={this.state.address}
            />
          </Form.Field>

          <Form.Field>
            <label>Proponente</label>
            <Input
              readOnly
              value={this.state.sender}
            />
          </Form.Field>

          <Form.Field>
            <label>Propuesto a: </label>
            <Input
              readOnly
              value={this.state.receiver}
            />
          </Form.Field>

          <Form.Field>
            <label>Estado</label>
            {
                 this.state.state==='finished'? 
                   (
                    <Label as='a' color='teal' horizontal>Finalizado</Label>
                   ) : (
                    this.state.state==='accepted'?
                    (
                      <Label as='a' color='yellow' horizontal>Aceptado</Label>
                    ) : (
                      this.state.state==='responsed'? 
                      (
                        <Label as='a' horizontal>Respondido</Label>
                      ) : (
                        this.state.state==='challenged'?
                        (
                          <Label as='a' color='red' horizontal>Retado</Label>
                        ) : (
                          this.state.state==='created'?
                          (
                            <Label as='a' color='green' horizontal>Creado</Label>
                          ):(
                            <Label as='a' horizontal>-</Label>
                          )
                        )
                      )
                    )
                   )
            }
          </Form.Field>

          <Form.Field>
            <label>p of ElGamal algorithm</label>
            <Input
              readOnly
              value={this.state.p}
            />
          </Form.Field>

          <Form.Field>
            <label>q of ElGamal algorithm</label>
            <Input
              readOnly
              value={variables.q}
            />
          </Form.Field>

          <Form.Field>
            <label>g of ElGamal algorithm</label>
            <Input
              readOnly
              value={this.state.g}
            />
          </Form.Field>

          <Form.Field>
            <label>c1 = g^r mod p</label>
            <Input
              readOnly
              value={this.state.c1}
            />
          </Form.Field>

          <Form.Field>
            <label>c2 = m·ya^r mod p</label>
            <Input
              readOnly
              value={this.state.c2}
            />
          </Form.Field>

          <Form.Field>
            <label>ya, public key of A, ya = g^xa mod p</label>
            <Input
              readOnly
              value={this.state.ya}
            />
          </Form.Field>

          <Form.Field>
            <label>Tiempo límite para firmar el contrato </label>
            <Input
              readOnly
              label="segundos"
              labelPosition="right"
              value={this.state.term}
            />
          </Form.Field>

          <Form.Field>
            <label>Fecha de inicio (Timestamp)</label>
            <Input
              readOnly
              value={this.state.start}
            />
          </Form.Field>

          <Form.Field>
            <label>z1 = g^s mod p</label>
            <Input
              readOnly
              value={this.state.z1}
            />
          </Form.Field>

          <Form.Field>
            <label>z2 = xb·ya^s mod p</label>
            <Input
              readOnly
              value={this.state.z2}
            />
          </Form.Field>

          <Form.Field>
            <label>yb, public key of B, yb = g^xb mod p</label>
            <Input
              readOnly
              value={this.state.yb}
            />
          </Form.Field>

          <Form.Field>
            <label>c (challenge number)</label>
            <Input
              readOnly
              value={this.state.c}
            />
          </Form.Field>

          <Form.Field>
            <label>w = r.add(c.mod(p).multiply(xb.mod(p)).mod(p))</label>
            <Input
              readOnly
              value={this.state.w}
            />
          </Form.Field>

          <Form.Field>
            <label>Contenido del contrato</label>
            <Input
              readOnly
              value={this.state.message}
            />
          </Form.Field>

          <Form.Field>
            <label>Deposito</label>
            <Input
              label="wei"
              labelPosition="right"
              value={this.state.deposit}
            />
          </Form.Field>

          <Message error header="ERROR" content={this.state.errorMessage} />
          <Button primary loading={this.state.loading}>
            Cerrar
          </Button>
        </Form>
      </div>
    );
  }
}

export default withRouter(DeliveryShow);
