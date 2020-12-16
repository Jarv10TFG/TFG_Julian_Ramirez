import React, { Component } from 'react';
import { Link } from "react-router-dom";
import { Table, Button, Icon, Message, Label } from 'semantic-ui-react';
import web3 from '../ethereum/web3';
import notification from '../ethereum/notification';
import variables from '../ethereum/variables';

const bigInt = require("big-integer");
const dateFormat = require('dateformat');

class DeliveryRow extends Component {
  state = {
    receiver: '',
    start: '',
    state: '',
    account: '',
    sender: '',
    loading: false,
    errorMessage: '',
    term: '',
    ahora: ''
  };

  componentDidMount = async () => {
    let deliveryContract = notification(this.props.delivery);
    let receiver = await deliveryContract.methods.receiver().call();
    let start = await deliveryContract.methods.start().call();
    let state = await deliveryContract.methods.getState(this.props.delivery).call();
    let term = await deliveryContract.methods.term().call();
    const accounts = await web3.eth.getAccounts();
    let sender = await deliveryContract.methods.sender().call();
    let d = new Date(0);
    d.setUTCSeconds(start);
    start = dateFormat(d, "dd/mm/yyyy HH:MM");

    this.setState({ 
      receiver: receiver,
      start: start,
      state: state,
      account: accounts[0],
      sender: sender,
      term: term
    });
  }

  onView = async () => {
    /*const campaign = Campaign(this.props.address);

    const accounts = await web3.eth.getAccounts();
    await campaign.methods.approveRequest(this.props.id).send({
      from: accounts[0]
    });*/
  };
  /*
  Estados que necesito: onChallenge, onResponse, onAccept, onFinish.

  Variables generadas al crear un contrato:
    Message(C), r, yA, g, xA, p, c1 y c2
  Variables que necesita cada estado:
  
  -onChallenge:
    copiar el onAccept de Miquel y adaptarlo un poquito.

  -onResponse
    copiar el onFinish de Miquel y modificarlo un poquito.

  -onAccept
    Aquí no se requiere ninguna variable. En este punto el firmante B debería poder leer el contrato en claro y en caso de que lo quiera aceptar solamente tiene que pulsar el botón
    y cambiar el estado del contrato de en respuesta a aceptado.

  -onFinish
    Resolver duda con Magdalena acerca de que significa M pero en principio tampoco debería enviar ninguna variable(el hecho de darle al botón para finalizar el contrato significa que lo ha firmado).
  */
  onChallenge = async (contractAddress) => {//solo puede acceder al onAccept el firmante B

    let c, s, z1, z2;

    this.setState({ loading: true, errorMessage: '' });

    try {
      let deliveryContract = notification(contractAddress);

      const accounts = await web3.eth.getAccounts();

      //clave privada de b xb
      let xb = bigInt(variables.xb.substr(2), 16);
      //clave publica de b yb
      let yb = bigInt(variables.yb.substr(2), 16);

      let p = bigInt((await deliveryContract.methods.p().call()).substr(2), 16);
      let g = bigInt((await deliveryContract.methods.g().call()).substr(2), 16);
      let ya = bigInt((await deliveryContract.methods.ya().call()).substr(2), 16);
      let q = p.minus(1).divide(2);

      // VARIABLES FOR ACCEPT()
      // Generation of challenge number c
      c = bigInt.randBetween(2, q.minus(1));      // Pot ser mes curt, meitat de bits
      
      // Generation of random number s
      s = bigInt.randBetween(2, q.minus(1));

      // Generation of z1 = g^s mod p
      z1 = g.modPow(s, p);
      // Generation of z2 = xb·ya^s mod p
      z2 = xb.multiply(ya.modPow(s, p));
      
      await deliveryContract.methods.challenge("0x"+z1.toString(16), "0x"+z2.toString(16), "0x"+yb.toString(16), "0x"+c.toString(16)).send({ from: accounts[0] });

      // Refresh
      alert('Contract challenged!');
      this.setState({ state: 'challenged' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  onResponse = async (contractAddress) => {//solo firmante A

    let w;

    this.setState({ loading: true, errorMessage: '' });

    try {
      let deliveryContract = notification(contractAddress);

      const accounts = await web3.eth.getAccounts();

      // La r la tendríamos que obtener como propiedad desde deliveryNew
      let r = bigInt(variables.r.substr(2), 16)
      // La xa la tendríamos que obtener como propiedad desde deliveryNew
      let xa = bigInt(variables.xa.substr(2), 16)

      let p = bigInt((await deliveryContract.methods.p().call()).substr(2), 16);
      let c = bigInt((await deliveryContract.methods.c().call()).substr(2), 16);
      let z1 = bigInt((await deliveryContract.methods.z1().call()).substr(2),16);
      let z2 = bigInt((await deliveryContract.methods.z2().call()).substr(2),16);
      let z3 = z1.modPow(xa, p);
      let z4 = z3.modInv(p);
      let xb = z2.multiply(z4.mod(p));

      // VARIABLES FOR FINISH()
      //const w = r.add(c.mod(p).multiply(xb.mod(p)).mod(p));
      
      w =  r.add(c.multiply(xb.mod(p)));
      
      await deliveryContract.methods.response("0x"+w.toString(16)).send({ from: accounts[0] });

      // Refresh
      alert('Contract responsed!');
      this.setState({ state: 'responsed' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  onAccept = async (contractAddress) =>{
    this.setState({ loading: true, errorMessage: '' });
    try{
      let deliveryContract = notification(contractAddress);

      const accounts = await web3.eth.getAccounts();

      await deliveryContract.methods.accept().send({ from: accounts[0] });

      // Refresh
      alert('Contract accepted!');
      this.setState({ state: 'accepted' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  onFinish = async (contractAddress) =>{
    this.setState({ loading: true, errorMessage: '' });
    try{
      let deliveryContract = notification(contractAddress);

      const accounts = await web3.eth.getAccounts();

      await deliveryContract.methods.finish().send({ from: accounts[0] });

      // Refresh
      alert('Contract finished!');
      this.setState({ state: 'finished' });
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
        this.setState({ loading: false });
    }
  };

  render() {
      return (// hay que poner 3 botones, uno para ver el contrato, otro para cancelA o B y otro para las funciones normales.
          <Table.Row>
              <Table.Cell>{this.props.id+1}</Table.Cell>
              <Table.Cell>{this.props.delivery}</Table.Cell>
              <Table.Cell>{this.state.receiver}</Table.Cell>
              <Table.Cell>{this.state.start}</Table.Cell>
              <Table.Cell>
                {
                 this.state.state==='finished'? 
                   (
                    <Label as='a' color='teal' horizontal>Finished</Label>
                   ) : (
                    this.state.state==='accepted'?
                    (
                      <Label as='a' color='yellow' horizontal>Accepted</Label>
                    ) : (
                      this.state.state==='responsed'? 
                      (
                        <Label as='a' horizontal>Responsed</Label>
                      ) : (
                        this.state.state==='challenged'?
                        (
                          <Label as='a' color='red' horizontal>Challenged</Label>
                        ) : (
                          this.state.state==='created'?
                          (
                            <Label as='a' color='green' horizontal>Created</Label>
                          ):(
                            <Label as='a' horizontal>-</Label>
                          )
                        )
                      )
                    )
                   )
                 }
              </Table.Cell>
              <Table.Cell>
                  {
                     
                     this.state.state==='accepted'?
                     (
                      <Button animated='vertical' color='green' onClick={() => this.onFinish(this.props.delivery)} disabled={(this.state.account!==this.state.sender)/*||(this.state.ahora.setUTCSeconds(Date.now)>this.state.start+this.state.term)*/} loading={this.state.loading}>
                        <Button.Content hidden>Finish</Button.Content>
                        <Button.Content visible>
                          <Icon name=' handshake' />
                        </Button.Content>
                      </Button>
                     ) : (
                       this.state.state==='responsed'? 
                       (
                        <Button animated='vertical' color='green' onClick={() => this.onAccept(this.props.delivery)} disabled={(this.state.account!==this.state.receiver)/*||(this.state.ahora.setUTCSeconds(Date.now)>this.state.start+this.state.term)*/} loading={this.state.loading}>
                        <Button.Content hidden>Accept</Button.Content>
                        <Button.Content visible>
                          <Icon name='check' />
                        </Button.Content>
                      </Button>
                       ) : (
                         this.state.state==='challenged'?
                         (
                          <Button animated='vertical' color='green' onClick={() => this.onResponse(this.props.delivery)} disabled={(this.state.account!==this.state.sender)/*||(this.state.ahora.setUTCSeconds(Date.now)>this.state.start+this.state.term)*/} loading={this.state.loading}>
                          <Button.Content hidden>Response</Button.Content>
                          <Button.Content visible>
                            <Icon name='stopwatch' />
                          </Button.Content>
                        </Button>
                         ) : (
                           this.state.state==='created'?
                           (
                            <Button animated='vertical' color='green' onClick={() => this.onChallenge(this.props.delivery)} disabled={(this.state.account!==this.state.receiver)/*||(this.state.ahora.setUTCSeconds(Date.now)>this.state.start+this.state.term)*/} loading={this.state.loading}>
                            <Button.Content hidden>Challenge</Button.Content>
                            <Button.Content visible>
                              <Icon name='file alternate outline' />
                            </Button.Content>
                          </Button>
                           ):(
                            <Button  color='green' onClick={() => this.onView} disabled loading={this.state.loading}>
                            Firmado
                            </Button>
                           )
                         )
                       )
                     
                    )







                   /* this.props.sent ? (
                      <Button animated='vertical' color='blue' onClick={() => this.onFinish(this.props.delivery)} disabled={this.state.state!=='accepted'} loading={this.state.loading}>
                        <Button.Content hidden>Finish</Button.Content>
                        <Button.Content visible>
                          <Icon name='send' />
                        </Button.Content>
                      </Button>
                    ) : (
                      <Button animated='vertical' color='blue' onClick={() => this.onChallenge(this.props.delivery)} disabled={this.state.state!=='created'} loading={this.state.loading}>
                        <Button.Content hidden>Accept</Button.Content>
                        <Button.Content visible>
                          <Icon name='check' />
                        </Button.Content>
                    </Button>
                    )*/
                  }
                  <Link to={"/deliveries/"+this.props.delivery}>
                    <Button animated='vertical' color='green' onClick={this.onView}>
                      <Button.Content hidden>View</Button.Content>
                      <Button.Content visible>
                        <Icon name='eye' />
                      </Button.Content>
                    </Button>
                  </Link>
                  <Message error header="ERROR" content={this.state.errorMessage} hidden={!this.state.errorMessage} />
              </Table.Cell>
          </Table.Row>
          
      );
    }
}

export default DeliveryRow;
