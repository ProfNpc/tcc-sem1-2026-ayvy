import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  saveAddress,
} from "../../utils/ordersStore";
import {
  atualizarStatusPedido,
  checkoutPedido,
  criarEndereco,
  criarPagamento,
  listEnderecos,
} from "../../services/pedidosApi";
import { formatCardExpiry, formatCardNumber, formatCep } from "../../utils/cartHelpers";
import { listPaymentMethods } from "../../utils/paymentMethodsStore";
import useCepLookup from "../../hooks/useCepLookup";
import "./style.css";

const STEPS = [
  { id: "endereco", label: "Endereço" },
  { id: "entrega", label: "Entrega" },
  { id: "pagamento", label: "Pagamento" },
];

const EMPTY_NEW = {
  nome: "",
  rua: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
  telefone: "",
  cpf: "",
};

function randomPixCode() {
  const chunk = () =>
    Math.random().toString(36).slice(2, 10).toUpperCase();
  return `00020126580014BR.GOV.BCB.PIX0136${chunk()}-${chunk()}52040000530398654${(Math.random() * 900 + 100).toFixed(2)}5802BR5925AYVY MARKETPLACE LTDA6009SAO PAULO62070503***6304${chunk().slice(0, 4)}`;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, loggedIn } = useAuth();
  const {
    cart,
    subtotal,
    freight,
    shippingOptions,
    freightValue,
    total,
    calculateFreight,
    selectFreightOption,
    clear,
    formatBRL,
    lineSubtotal,
    setDrawerOpen,
  } = useCart();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("novo");
  const [newAddress, setNewAddress] = useState(EMPTY_NEW);
  const { formatAndLookup, cepLoading, cepError, cepHint } = useCepLookup((data) => {
    setNewAddress((a) => ({
      ...a,
      rua: data.logradouro || a.rua,
      bairro: data.bairro || a.bairro,
      cidade: data.cidade || a.cidade,
      uf: data.estado || a.uf,
    }));
  });
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [savedCards, setSavedCards] = useState(() => listPaymentMethods(user?.id));
  const [selectedCardId, setSelectedCardId] = useState("");
  const [card, setCard] = useState({
    number: "",
    validity: "",
    cvv: "",
    holder: "",
    installments: "1",
  });
  const [pixCode, setPixCode] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = listPaymentMethods(user?.id);
    setSavedCards(list);
    // Prefere cartão salvo; senão formulário novo
    setSelectedCardId(list.length > 0 ? list[0].id : "novo");
    if (list.length > 0) {
      const pm = list[0];
      setCard((c) => ({
        ...c,
        number: formatCardNumber(pm.number || ""),
        validity: formatCardExpiry(pm.validity || ""),
        holder: pm.holder || "",
        cvv: "",
      }));
    }
  }, [user?.id]);

  function applySavedCard(pmId) {
    setSelectedCardId(pmId);
    if (pmId === "novo" || !pmId) {
      setCard((c) => ({
        ...c,
        number: "",
        validity: "",
        holder: "",
        cvv: "",
      }));
      return;
    }
    const pm = savedCards.find((c) => c.id === pmId);
    if (!pm) return;
    setCard((c) => ({
      ...c,
      number: formatCardNumber(pm.number || ""),
      validity: formatCardExpiry(pm.validity || ""),
      holder: pm.holder || "",
      cvv: "",
    }));
  }

  const usingSavedCard = Boolean(selectedCardId && selectedCardId !== "novo");
  const isCardPay =
    paymentMethod === "cartao_credito" || paymentMethod === "cartao_debito";
  const cardKindWanted =
    paymentMethod === "cartao_debito" ? "debito" : "credito";
  const cardsForMethod = useMemo(
    () =>
      isCardPay
        ? savedCards.filter((c) => (c.kind || "credito") === cardKindWanted)
        : [],
    [savedCards, isCardPay, cardKindWanted],
  );

  function selectPayMethod(method) {
    setPaymentMethod(method);
    setPixCode("");
    setPixCopied(false);
    if (method === "cartao_credito" || method === "cartao_debito") {
      const kind = method === "cartao_debito" ? "debito" : "credito";
      const list = savedCards.filter((c) => (c.kind || "credito") === kind);
      if (list.length) applySavedCard(list[0].id);
      else applySavedCard("novo");
    }
  }

  const installmentsField = (
    <label>
      Parcelamento
      <select
        value={card.installments}
        onChange={(e) => setCard((c) => ({ ...c, installments: e.target.value }))}
      >
        <option value="1">1x de {formatBRL(total)} sem juros</option>
        <option value="2">2x de {formatBRL(total / 2)} sem juros</option>
        <option value="3">3x de {formatBRL(total / 3)} sem juros</option>
        <option value="4">4x de {formatBRL(total / 4)} sem juros</option>
      </select>
    </label>
  );
  const cvvField = (
    <label className="ck-card-cvv">
      CVV
      <input
        value={card.cvv}
        placeholder="123"
        inputMode="numeric"
        autoComplete="cc-csc"
        maxLength={4}
        onChange={(e) =>
          setCard((c) => ({
            ...c,
            cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
          }))
        }
      />
    </label>
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setAddresses([]);
        setSelectedAddressId("novo");
        return;
      }
      try {
        const apiList = await listEnderecos();
        const mine = (apiList || [])
          .filter((e) => {
            const uid = e?.usuario?.id ?? e?.usuarioId;
            return uid == null || Number(uid) === Number(user.id);
          })
          .map((e) => ({
            id: `api-${e.id}`,
            apiId: e.id,
            nome:
              e.apelido ||
              e.nome ||
              user.displayName ||
              "Meu endereço",
            numero: e.numero || "",
            rua: e.logradouro || "",
            complemento: e.complemento || "",
            bairro: e.bairro || "",
            cidade: e.cidade || "",
            uf: e.uf || "",
            cep: formatCep(String(e.cep || "").replace(/\D/g, "")),
            telefone: user.telefone || "",
            cpf: "",
          }));
        if (cancelled) return;
        setAddresses(mine);
        setSelectedAddressId(mine.length > 0 ? mine[0].id : "novo");
      } catch {
        if (!cancelled) {
          setAddresses([]);
          setSelectedAddressId("novo");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.displayName, user?.telefone]);

  const selectedAddress = useMemo(() => {
    if (selectedAddressId === "novo") return null;
    return addresses.find((a) => a.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);

  const accountName = user?.displayName || user?.login || "Cliente";
  const accountEmail =
    user?.email || `${user?.login || "cliente"}@ayvy.local`;

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />;
  }

  if (cart.length === 0) {
    return <Navigate to="/carrinho" replace />;
  }

  function resolveAddress() {
    if (selectedAddressId === "novo") {
      const cep = String(newAddress.cep || "").replace(/\D/g, "");
      if (
        !newAddress.nome.trim() ||
        !newAddress.rua.trim() ||
        !newAddress.cidade.trim() ||
        !newAddress.uf.trim() ||
        cep.length !== 8
      ) {
        return null;
      }
      return {
        ...newAddress,
        cep: formatCep(cep),
        nome: newAddress.nome.trim(),
      };
    }
    return selectedAddress;
  }

  async function ensureFreightForAddress(addr) {
    const cepDigits = String(addr.cep).replace(/\D/g, "");
    if (!freight.cepConfirmed || freight.cep !== cepDigits) {
      await calculateFreight(cepDigits);
    }
  }

  async function handleContinueAddress() {
    setError("");
    const addr = resolveAddress();
    if (!addr) {
      setError("Selecione ou preencha um endereço completo (com CEP).");
      return;
    }
    if (selectedAddressId === "novo") {
      if (user?.id) {
        try {
          const created = await criarEndereco({
            usuario: { id: user.id },
            logradouro: addr.rua,
            numero: addr.numero || "S/N",
            complemento: addr.complemento || null,
            bairro: addr.bairro || "Centro",
            cidade: addr.cidade,
            uf: String(addr.uf || "").slice(0, 2).toUpperCase(),
            cep: String(addr.cep || "").replace(/\D/g, ""),
            principal: true,
            apelido: addr.nome || "Entrega",
          });
          const apiId = created?.id;
          const mapped = {
            id: apiId != null ? `api-${apiId}` : `local-${Date.now()}`,
            apiId: apiId ?? null,
            nome: addr.nome,
            numero: addr.numero || "S/N",
            rua: addr.rua,
            complemento: addr.complemento || "",
            bairro: addr.bairro || "",
            cidade: addr.cidade,
            uf: addr.uf,
            cep: addr.cep,
            telefone: user.telefone || "",
            cpf: "",
          };
          setAddresses((prev) => [mapped, ...prev.filter((a) => a.id !== mapped.id)]);
          setSelectedAddressId(mapped.id);
        } catch {
          const local = saveAddress(addr);
          setAddresses((prev) => [local, ...prev.filter((a) => a.id !== local.id)]);
          setSelectedAddressId(local.id);
        }
      } else {
        const local = saveAddress(addr);
        setAddresses((prev) => [local, ...prev.filter((a) => a.id !== local.id)]);
        setSelectedAddressId(local.id);
      }
    }
    await ensureFreightForAddress(addr);
    setStep(1);
  }

  function handleContinueShipping() {
    setError("");
    if (!freight.cepConfirmed || !shippingOptions.length) {
      setError("Aguarde o frete ou volte e confira o CEP do endereço.");
      return;
    }
    const opt =
      shippingOptions.find((o) => o.id === freight.selectedOptionId) ||
      shippingOptions[0];
    if (!opt) {
      setError("Selecione uma opção de entrega.");
      return;
    }
    selectFreightOption(opt.id);
    setStep(2);
  }

  function handleGeneratePix() {
    setPixCode(randomPixCode());
    setPixCopied(false);
    setError("");
  }

  async function handleCopyPix() {
    const code = pixCode || randomPixCode();
    if (!pixCode) setPixCode(code);
    try {
      await navigator.clipboard.writeText(code);
      setPixCopied(true);
    } catch {
      setPixCopied(false);
      setError("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  async function handleFinalize() {
    setError("");
    if (!user?.id) {
      setError("Faça login novamente para finalizar a compra.");
      return;
    }
    const addr = resolveAddress();
    if (!addr) {
      setError("Endereço inválido.");
      setStep(0);
      return;
    }
    const freightOpt =
      shippingOptions.find((o) => o.id === freight.selectedOptionId) ||
      shippingOptions[0];
    if (!freightOpt) {
      setError("Selecione o frete.");
      setStep(1);
      return;
    }

    const isCard =
      paymentMethod === "cartao_credito" || paymentMethod === "cartao_debito";
    if (isCard) {
      const digits = String(card.number || "").replace(/\D/g, "");
      if (digits.length < 13 || !card.validity || !card.cvv || !card.holder.trim()) {
        setError("Preencha os dados do cartão (incluindo CVV).");
        return;
      }
    }
    if (paymentMethod === "pix" && !pixCode) {
      setError("Gere o QR Code / código Pix antes de confirmar o pagamento.");
      return;
    }

    const apiItems = cart
      .map((line) => {
        const raw = line.apiId ?? line.productId;
        const produtoId = Number(raw);
        return {
          produtoId: Number.isFinite(produtoId) && produtoId > 0 ? produtoId : null,
          quantidade: line.quantity || 1,
        };
      })
      .filter((i) => i.produtoId != null);

    if (apiItems.length !== cart.length || apiItems.length === 0) {
      setError(
        "Há itens no carrinho que não estão na API (catálogo antigo/mock). Remova-os, compre produtos cadastrados pelo lojista e tente de novo.",
      );
      return;
    }

    setSaving(true);
    try {
      const cep = String(addr.cep || "").replace(/\D/g, "");
      const pedido = await checkoutPedido({
        usuarioId: user.id,
        observacao: "",
        enderecoEntrega: {
          logradouro: addr.rua || addr.logradouro,
          numero: addr.numero || "S/N",
          complemento: addr.complemento || null,
          bairro: addr.bairro || "Centro",
          cidade: addr.cidade,
          uf: String(addr.uf || "").slice(0, 2).toUpperCase(),
          cep,
        },
        itens: apiItems,
      });

      const tipoPagamento =
        paymentMethod === "cartao_credito"
          ? "cartao_credito"
          : paymentMethod === "cartao_debito"
            ? "cartao_debito"
            : "pix";

      try {
        await criarPagamento({
          pedido: { id: pedido.id },
          valor: Number(pedido.valorTotal) || subtotal + freightOpt.price,
          status: "aprovado",
          tipo: tipoPagamento,
          referencia:
            paymentMethod === "pix"
              ? pixCode
              : `****${String(card.number).replace(/\D/g, "").slice(-4)}`,
        });
      } catch (payErr) {
        setError(
          payErr.message ||
            "Pedido criado, mas o pagamento não foi registrado. Tente de novo ou fale com o suporte.",
        );
        setSaving(false);
        return;
      }

      try {
        await atualizarStatusPedido(pedido.id, "pago", user.id);
      } catch {
        /* status pode permanecer aguardando_pagamento */
      }

      const orderId = `#AY-${pedido.id}`;
      clear();
      setDrawerOpen(false);
      navigate(
        `/pedido/sucesso?id=${encodeURIComponent(orderId)}&pay=${encodeURIComponent(tipoPagamento)}`,
        { replace: true },
      );
    } catch (err) {
      const raw = err.message || "Não foi possível finalizar o pedido na API.";
      const msg = /endereço principal/i.test(raw)
        ? "A loja deste produto ainda não cadastrou endereço de origem. Peça ao lojista para salvar um endereço principal no perfil, ou tente outro produto."
        : raw;
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const shipOpt =
    shippingOptions.find((o) => o.id === freight.selectedOptionId) ||
    shippingOptions[0];

  const displayAddress = selectedAddress || (step === 0 ? null : resolveAddress());

  return (
    <div className="ck-page ck-checkout">
      <header className="ck-checkout-top">
        <Link to="/" className="ck-logo">
          AYVY
        </Link>
        <nav className="ck-steps" aria-label="Etapas do checkout">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`ck-step${i === step ? " is-active" : ""}${i < step ? " is-done" : ""}`}
              onClick={() => {
                if (i <= step) setStep(i);
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <span className="ck-secure">
          <i className="fas fa-shield-alt" aria-hidden /> Site 100% seguro
        </span>
      </header>

      <div className="ck-checkout-grid-3">
        {/* Coluna 1 — conta + endereço */}
        <div className="ck-col">
          <section className="ck-panel">
            <h2>Dados da sua conta</h2>
            <div className="ck-account-grid">
              <label>
                Nome completo
                <input type="text" value={accountName} readOnly />
              </label>
              <label>
                Email
                <input type="email" value={accountEmail} readOnly />
              </label>
            </div>
          </section>

          <section className="ck-panel">
            <div className="ck-panel-head">
              <h2>Endereço de entrega</h2>
              {step > 0 ? (
                <button type="button" className="ck-edit" onClick={() => setStep(0)}>
                  Editar
                </button>
              ) : null}
            </div>

            {step === 0 ? (
              <>
                <ul className="ck-addr-list">
                  {addresses.map((addr) => (
                    <li key={addr.id}>
                      <label
                        className={`ck-addr-card${selectedAddressId === addr.id ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="addr"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <div>
                          <strong>{addr.nome}</strong>
                          <p>
                            {addr.rua}
                            {addr.complemento ? `, ${addr.complemento}` : ""}
                          </p>
                          <p>
                            {addr.bairro} — {addr.cidade}/{addr.uf}
                          </p>
                          <p>CEP {addr.cep}</p>
                        </div>
                      </label>
                    </li>
                  ))}
                  <li>
                    <label
                      className={`ck-addr-card${selectedAddressId === "novo" ? " is-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="addr"
                        checked={selectedAddressId === "novo"}
                        onChange={() => setSelectedAddressId("novo")}
                      />
                      <div>
                        <strong>Novo endereço</strong>
                        <p>Cadastrar um endereço de entrega</p>
                      </div>
                    </label>
                  </li>
                </ul>

                {selectedAddressId === "novo" && (
                  <div className="ck-new-addr">
                    <label>
                      Nome no endereço
                      <input
                        value={newAddress.nome}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, nome: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      CEP
                      <input
                        value={newAddress.cep}
                        maxLength={9}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="00000-000"
                        onChange={(e) => {
                          const { formatted } = formatAndLookup(e.target.value);
                          setNewAddress((a) => ({ ...a, cep: formatted }));
                        }}
                        onBlur={() => formatAndLookup(newAddress.cep)}
                      />
                      {cepLoading ? (
                        <span className="ck-cep-hint">Buscando endereço…</span>
                      ) : null}
                      {cepError ? (
                        <span className="ck-cep-hint ck-cep-hint--err">{cepError}</span>
                      ) : null}
                      {!cepError && cepHint ? (
                        <span className="ck-cep-hint">{cepHint}</span>
                      ) : null}
                    </label>
                    <label className="ck-span-2">
                      Rua / número
                      <input
                        value={newAddress.rua}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, rua: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Complemento
                      <input
                        value={newAddress.complemento}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, complemento: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Bairro
                      <input
                        value={newAddress.bairro}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, bairro: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Cidade
                      <input
                        value={newAddress.cidade}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, cidade: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      UF
                      <input
                        value={newAddress.uf}
                        maxLength={2}
                        onChange={(e) =>
                          setNewAddress((a) => ({
                            ...a,
                            uf: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </label>
                    <label>
                      CPF
                      <input
                        value={newAddress.cpf}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, cpf: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Telefone
                      <input
                        value={newAddress.telefone}
                        onChange={(e) =>
                          setNewAddress((a) => ({ ...a, telefone: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                )}

                {error && step === 0 ? <p className="ck-error">{error}</p> : null}
                <button
                  type="button"
                  className="ck-btn ck-btn--primary ck-btn--block"
                  onClick={handleContinueAddress}
                >
                  Continuar
                </button>
              </>
            ) : displayAddress ? (
              <div className="ck-addr-card is-selected ck-addr-readonly">
                <div>
                  <strong>{displayAddress.nome}</strong>
                  <p>{displayAddress.rua}</p>
                  <p>
                    {displayAddress.cidade}/{displayAddress.uf} — CEP {displayAddress.cep}
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Coluna 2 — frete + pagamento */}
        <div className="ck-col">
          <section className="ck-panel">
            <div className="ck-panel-head">
              <h2>Entrega</h2>
              {step > 1 ? (
                <button type="button" className="ck-edit" onClick={() => setStep(1)}>
                  Editar
                </button>
              ) : null}
            </div>

            {step === 0 ? (
              <p className="ck-muted">Confirme o endereço para ver as opções de frete.</p>
            ) : step === 1 ? (
              <>
                {!freight.cepConfirmed || shippingOptions.length === 0 ? (
                  <p className="ck-muted">Calculando opções de frete…</p>
                ) : (
                  <ul className="ck-ship-opts ck-ship-opts--big">
                    {shippingOptions.map((opt) => (
                      <li key={opt.id}>
                        <label className={freight.selectedOptionId === opt.id ? "is-selected" : ""}>
                          <input
                            type="radio"
                            name="checkout-ship"
                            checked={freight.selectedOptionId === opt.id}
                            onChange={() => selectFreightOption(opt.id)}
                          />
                          <span>
                            <strong>{opt.name}</strong>
                            <small>{opt.days}</small>
                          </span>
                          <em>{opt.priceLabel}</em>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                {error && step === 1 ? <p className="ck-error">{error}</p> : null}
                <button
                  type="button"
                  className="ck-btn ck-btn--primary ck-btn--block"
                  style={{ marginTop: "0.85rem" }}
                  onClick={handleContinueShipping}
                >
                  Continuar
                </button>
              </>
            ) : shipOpt ? (
              <p className="ck-ship-summary">
                {shipOpt.name}: {shipOpt.days} — <strong>{shipOpt.priceLabel}</strong>
              </p>
            ) : (
              <p className="ck-muted">Nenhuma opção selecionada.</p>
            )}
          </section>

          <section className="ck-panel">
            <h2>Pagamento</h2>

            {step < 2 ? (
              <p className="ck-muted">Escolha a entrega para liberar o pagamento.</p>
            ) : (
              <>
                <label className={`ck-pay-option${paymentMethod === "cartao_credito" ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "cartao_credito"}
                    onChange={() => selectPayMethod("cartao_credito")}
                  />
                  <span>Cartão de crédito</span>
                </label>

                {paymentMethod === "cartao_credito" && (
                  <div className="ck-card-form">
                    {cardsForMethod.length > 0 ? (
                      <ul className="ck-card-pick-list">
                        {cardsForMethod.map((pm) => (
                          <li key={pm.id}>
                            <label className="ck-card-pick">
                              <input
                                type="radio"
                                name="saved-card-credito"
                                checked={selectedCardId === pm.id}
                                onChange={() => applySavedCard(pm.id)}
                              />
                              <span>
                                {pm.holder || pm.brand || "Cartão"}
                                {" · "}
                                {pm.brand || "Cartão"} •••• {pm.last4}
                              </span>
                            </label>
                          </li>
                        ))}
                        <li>
                          <label className="ck-card-pick">
                            <input
                              type="radio"
                              name="saved-card-credito"
                              checked={selectedCardId === "novo"}
                              onChange={() => applySavedCard("novo")}
                            />
                            <span>Usar outro cartão</span>
                          </label>
                        </li>
                      </ul>
                    ) : (
                      <p className="ck-muted ck-card-hint">
                        Nenhum cartão de crédito no perfil.{" "}
                        <Link to="/perfil?aba=seguranca">Adicionar em Segurança</Link>
                        {" "}ou preencha abaixo.
                      </p>
                    )}

                    {usingSavedCard ? (
                      <>
                        <div className="ck-card-row ck-card-row--saved">{cvvField}</div>
                        {installmentsField}
                      </>
                    ) : (
                      <>
                        <label>
                          Número do cartão
                          <input
                            value={card.number}
                            placeholder="ACCT-000003"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength={19}
                            onChange={(e) => {
                              setSelectedCardId("novo");
                              setCard((c) => ({
                                ...c,
                                number: formatCardNumber(e.target.value),
                              }));
                            }}
                          />
                        </label>
                        <div className="ck-card-row">
                          <label>
                            Validade
                            <input
                              value={card.validity}
                              placeholder="MM/AA"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              maxLength={5}
                              onChange={(e) => {
                                setSelectedCardId("novo");
                                setCard((c) => ({
                                  ...c,
                                  validity: formatCardExpiry(e.target.value),
                                }));
                              }}
                            />
                          </label>
                          {cvvField}
                        </div>
                        <label>
                          Nome do titular
                          <input
                            value={card.holder}
                            autoComplete="cc-name"
                            onChange={(e) => {
                              setSelectedCardId("novo");
                              setCard((c) => ({ ...c, holder: e.target.value }));
                            }}
                          />
                        </label>
                        {installmentsField}
                      </>
                    )}
                  </div>
                )}

                <label className={`ck-pay-option${paymentMethod === "cartao_debito" ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "cartao_debito"}
                    onChange={() => selectPayMethod("cartao_debito")}
                  />
                  <span>Cartão de débito</span>
                </label>

                {paymentMethod === "cartao_debito" && (
                  <div className="ck-card-form">
                    {cardsForMethod.length > 0 ? (
                      <ul className="ck-card-pick-list">
                        {cardsForMethod.map((pm) => (
                          <li key={pm.id}>
                            <label className="ck-card-pick">
                              <input
                                type="radio"
                                name="saved-card-debito"
                                checked={selectedCardId === pm.id}
                                onChange={() => applySavedCard(pm.id)}
                              />
                              <span>
                                {pm.holder || pm.brand || "Cartão"}
                                {" · "}
                                {pm.brand || "Cartão"} •••• {pm.last4}
                              </span>
                            </label>
                          </li>
                        ))}
                        <li>
                          <label className="ck-card-pick">
                            <input
                              type="radio"
                              name="saved-card-debito"
                              checked={selectedCardId === "novo"}
                              onChange={() => applySavedCard("novo")}
                            />
                            <span>Usar outro cartão</span>
                          </label>
                        </li>
                      </ul>
                    ) : (
                      <p className="ck-muted ck-card-hint">
                        Nenhum cartão de débito no perfil.{" "}
                        <Link to="/perfil?aba=seguranca">Adicionar em Segurança</Link>
                        {" "}ou preencha abaixo.
                      </p>
                    )}

                    {usingSavedCard ? (
                      <div className="ck-card-row ck-card-row--saved">{cvvField}</div>
                    ) : (
                      <>
                        <label>
                          Número do cartão
                          <input
                            value={card.number}
                            placeholder="ACCT-000003"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength={19}
                            onChange={(e) => {
                              setSelectedCardId("novo");
                              setCard((c) => ({
                                ...c,
                                number: formatCardNumber(e.target.value),
                              }));
                            }}
                          />
                        </label>
                        <div className="ck-card-row">
                          <label>
                            Validade
                            <input
                              value={card.validity}
                              placeholder="MM/AA"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              maxLength={5}
                              onChange={(e) => {
                                setSelectedCardId("novo");
                                setCard((c) => ({
                                  ...c,
                                  validity: formatCardExpiry(e.target.value),
                                }));
                              }}
                            />
                          </label>
                          {cvvField}
                        </div>
                        <label>
                          Nome do titular
                          <input
                            value={card.holder}
                            autoComplete="cc-name"
                            onChange={(e) => {
                              setSelectedCardId("novo");
                              setCard((c) => ({ ...c, holder: e.target.value }));
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}

                <label className={`ck-pay-option${paymentMethod === "pix" ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === "pix"}
                    onChange={() => selectPayMethod("pix")}
                  />
                  <span>Pix</span>
                </label>

                {paymentMethod === "pix" && (
                  <div className="ck-pix-box">
                    <h3>Pagamento via Pix</h3>
                    <div className="ck-pix-actions">
                      <button type="button" className="ck-btn ck-btn--primary" onClick={handleGeneratePix}>
                        Gerar QR Code
                      </button>
                      <button type="button" className="ck-btn ck-btn--ghost" onClick={handleCopyPix}>
                        Copiar código Pix
                      </button>
                    </div>
                    {pixCode ? (
                      <>
                        <div className="ck-pix-qr" aria-hidden>
                          <div>
                            <i className="fas fa-qrcode" style={{ fontSize: "2.5rem" }} />
                            <p>Pix copia e cola</p>
                          </div>
                        </div>
                        <p className="ck-pix-code">{pixCode}</p>
                        <p className="ck-pix-hint">
                          {pixCopied
                            ? "Código copiado! Depois de pagar, confirme abaixo."
                            : "Copie o código Pix e confirme o pagamento após pagar."}
                        </p>
                      </>
                    ) : (
                      <p className="ck-pix-hint">
                        Gere o código Pix para continuar o pagamento.
                      </p>
                    )}
                  </div>
                )}

                {error && step === 2 ? <p className="ck-error">{error}</p> : null}

                {isCardPay ? (
                  <button
                    type="button"
                    className="ck-btn ck-btn--primary ck-btn--block"
                    disabled={saving}
                    onClick={handleFinalize}
                  >
                    {saving ? "Finalizando…" : "Finalizar compra"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ck-btn ck-btn--primary ck-btn--block"
                    disabled={saving || !pixCode}
                    onClick={handleFinalize}
                  >
                    {saving ? "Confirmando…" : "Confirmar pagamento Pix"}
                  </button>
                )}
              </>
            )}
          </section>
        </div>

        {/* Coluna 3 — resumo */}
        <aside className="ck-summary ck-summary--sticky">
          <div className="ck-summary-head">
            <h2>Resumo</h2>
            <span>
              {cart.length} {cart.length === 1 ? "item" : "itens"}
            </span>
          </div>
          <ul className="ck-summary-products">
            {cart.map((item) => (
              <li key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                    {item.color || item.size ? " · " : ""}
                    Qtd {item.quantity || 1}
                  </span>
                </div>
                <em>{formatBRL(lineSubtotal(item))}</em>
              </li>
            ))}
          </ul>
          <div className="ck-summary-row">
            <span>Subtotal</span>
            <strong>{formatBRL(subtotal)}</strong>
          </div>
          <div className="ck-summary-row">
            <span>Frete</span>
            <strong>
              {shipOpt
                ? shipOpt.priceLabel
                : freight.cepConfirmed
                  ? formatBRL(freightValue)
                  : "A calcular"}
            </strong>
          </div>
          <div className="ck-summary-total">
            <span>Total</span>
            <strong>{formatBRL(shipOpt ? subtotal + shipOpt.price : total)}</strong>
          </div>
          <Link to="/carrinho" className="ck-link-more">
            Voltar ao carrinho
          </Link>
        </aside>
      </div>
    </div>
  );
}
