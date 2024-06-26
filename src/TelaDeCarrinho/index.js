import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import {
  Cart,
  Bar,
  TitleBar,
  Rectangle,
  TextAddress,
  AddressUser,
  TitleCart,
  ButtonConfirmCart,
  Subtotal,
  SubtotalValor,
  ValorCart,
  ValorFrete,
  PayMethod,
  OptionsPayMethod,
  CustomRadio,
  LabelRadio,
  Container,
  DadosRestaurante,
} from './styles';
import {
  CardProduto,
  CardImagem,
  CardTexto,
  CardNome,
  CardDescription,
  CardPrice,
  BtnQuantidade,
  BtnRemoveQuantidade,
  CardInfo,
  CardTextoDelivery,
} from '../TelaListaDeRestaurantes/styles';
import axios from 'axios';
import CarrinhoContext from '../Contexts/CarrinhoContext';
import useProtectedRoute from '../Hooks/useProtectedRoute';
import { useNavigate } from 'react-router-dom';

// const token = window.localStorage.getItem('token');

const baseUrl = 'https://us-central1-missao-newton.cloudfunctions.net/rappi4A';

function TelaDeCarrinho() {
  const navigate = useNavigate();
  const token = useProtectedRoute();
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [address, setAddress] = useState({});
  const [cor, setCor] = useState(false);
  const [enderecoRestaurante, setEnderecoRestaurante] = useState({});
  const carrinhoContext = useContext(CarrinhoContext);

  const axiosConfig = useMemo(
    () => ({
      headers: {
        auth: token,
      },
    }),
    [token],
  );

  let valorTotal = 0;
  let arrayPlaceOrder = [];
  carrinhoContext.carrinho.forEach((produto) => {
    valorTotal = valorTotal + produto.price * produto.quantity;
    arrayPlaceOrder.push({
      quantity: Number(produto.quantity),
      id: produto.id,
    });
  });

  const getFullAdress = useCallback(async () => {
    axios
      .get(`${baseUrl}/profile/address`, axiosConfig)
      .then((response) => {
        setAddress(response.data.address);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, [axiosConfig]);

  const getRestaurantDetail = useCallback(async () => {
    axios
      .get(
        `${baseUrl}/restaurants/${carrinhoContext.carrinho[0].restauranteId}`,
        axiosConfig,
      )
      .then((response) => {
        setEnderecoRestaurante(response.data.restaurant);
        console.log(response.data.restaurant);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, [axiosConfig, carrinhoContext.carrinho]);

  const enviaPedido = (event) => {
    event.preventDefault();
    const body = {
      products: arrayPlaceOrder,
      paymentMethod: metodoPagamento,
    };
    if (metodoPagamento !== '' && carrinhoContext.carrinho.length !== 0) {
      axios
        .post(
          `${baseUrl}/restaurants/${carrinhoContext.carrinho[0].restauranteId}/order`,
          body,
          axiosConfig,
        )
        .then(() => {
          alert('Pedido enviado!');
          limpaCarrinho();
        })
        .catch((err) => {
          console.log(err.message);
          alert('Já existe um pedido em andamento.');
          limpaCarrinho();
        });
    }
  };

  const pegaMetodoPagamento = (event) => {
    setMetodoPagamento(event.target.value);
  };

  const mudaCorBotao = useCallback(() => {
    if (metodoPagamento !== '' && carrinhoContext.carrinho.length !== 0) {
      setCor(!cor);
    }
  }, [carrinhoContext.carrinho.length, cor, metodoPagamento]);

  const removerProduto = (produtoId) => {
    carrinhoContext.dispatch({
      type: 'REMOVE_PRODUTO_CARRINHO',
      produtoId: produtoId,
    });
  };

  const limpaCarrinho = () => {
    carrinhoContext.dispatch({ type: 'LIMPA_CARRINHO' });
  };

  useEffect(() => {
    if (token === null) {
      navigate('/login');
    }

    carrinhoContext.carrinho.length !== 0 && getRestaurantDetail();
    getFullAdress();
    mudaCorBotao();
  }, [
    metodoPagamento,
    carrinhoContext,
    getRestaurantDetail,
    mudaCorBotao,
    token,
    getFullAdress,
    navigate,
  ]);

  const itensCarrinho = carrinhoContext.carrinho.map((item) => {
    return (
      <CardProduto key={item.id}>
        <CardImagem src={item.photoUrl} alt={item.name} />
        <CardTexto>
          <CardNome>{item.name}</CardNome>
          <CardDescription>{item.description}</CardDescription>
          <CardPrice>R${item.price.toFixed(2).replace('.', ',')}</CardPrice>
        </CardTexto>

        {carrinhoContext.carrinho.map((produtoCarrinho) => {
          if (item.id === produtoCarrinho.id) {
            return (
              <BtnQuantidade key={produtoCarrinho.id}>
                {produtoCarrinho.quantity}
              </BtnQuantidade>
            );
          }
          return null;
        })}

        {carrinhoContext.carrinho.findIndex(
          (produtoCarrinho) => item.id === produtoCarrinho.id,
        ) !== -1 ? (
          <BtnRemoveQuantidade onClick={() => removerProduto(item.id)}>
            remover
          </BtnRemoveQuantidade>
        ) : (
          ''
        )}
      </CardProduto>
    );
  });

  return (
    <Cart>
      <Bar>
        <TitleBar>Meu carrinho</TitleBar>
      </Bar>
      <Rectangle>
        <TextAddress>Endereço de entrega</TextAddress>
        <AddressUser>
          {address.street}, {address.number}
        </AddressUser>
      </Rectangle>
      <Container>
        {carrinhoContext.carrinho.length !== 0 ? (
          <>
            {enderecoRestaurante && (
              <DadosRestaurante>
                <CardNome>{enderecoRestaurante.name}</CardNome>
                <CardInfo>{enderecoRestaurante.address}</CardInfo>
                <CardTextoDelivery>
                  <CardInfo>{enderecoRestaurante.deliveryTime} min</CardInfo>
                </CardTextoDelivery>
              </DadosRestaurante>
            )}
            {itensCarrinho}
          </>
        ) : (
          <TitleCart>Carrinho vazio</TitleCart>
        )}
        <ValorFrete>
          Frete R${' '}
          {carrinhoContext.carrinho.length !== 0
            ? enderecoRestaurante.shipping + '.00'
            : '0.00'}
        </ValorFrete>
        <ValorCart>
          <Subtotal>SUBTOTAL</Subtotal>
          <SubtotalValor> R$ {valorTotal.toFixed(2)}</SubtotalValor>
        </ValorCart>
        <PayMethod>Forma de pagamento</PayMethod>
        <OptionsPayMethod onSubmit={enviaPedido}>
          <LabelRadio>
            <CustomRadio
              type="radio"
              name="a"
              value="money"
              onChange={pegaMetodoPagamento}
              required
            />{' '}
            Dinheiro
          </LabelRadio>
          <LabelRadio>
            <CustomRadio
              type="radio"
              name="a"
              value="creditcard"
              onChange={pegaMetodoPagamento}
              required
            />{' '}
            Cartão de crédito
          </LabelRadio>
          <ButtonConfirmCart cor={cor ? '#e86e5a' : 'rgba(232, 110, 90, 0.5)'}>
            Confirmar
          </ButtonConfirmCart>
        </OptionsPayMethod>
      </Container>
    </Cart>
  );
}

export default TelaDeCarrinho;
