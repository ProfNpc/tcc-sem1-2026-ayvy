package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import com.ayvy.api_java.infrastructure.geo.CalculadoraDistancia;
import com.ayvy.api_java.infrastructure.geo.CepGeoLocalizacaoClient;
import com.ayvy.api_java.infrastructure.geo.Coordinates;
import com.ayvy.api_java.infrastructure.repositories.EnderecoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FreteService {

    private final CepGeoLocalizacaoClient geoLocalizacaoClient;
    private final EnderecoRepository enderecoRepository;

    public FreteService(CepGeoLocalizacaoClient geoLocalizacaoClient, EnderecoRepository enderecoRepository) {
        this.geoLocalizacaoClient = geoLocalizacaoClient;
        this.enderecoRepository = enderecoRepository;
    }

    /**
     * Agrupa os itens por lojista, calcula 1 frete por lojista (usando o endereço
     * principal de cada loja como origem) e SOMA tudo — carrinho com N lojistas
     * paga N fretes, um por remetente.
     */

    public BigDecimal calcularFreteTotal(List<PedidoProdutos> itens, String cepDestino) {
        Coordinates destino = geoLocalizacaoClient.buscarCoordenadas(cepDestino);

        Map<Lojista, List<PedidoProdutos>> itensPorLoja = itens.stream()
                .collect(Collectors.groupingBy(PedidoProdutos::getLojista));

        BigDecimal total = BigDecimal.ZERO;
        for (Lojista lojista : itensPorLoja.keySet()) {
            String cepOrigem = buscarCepOrigemLoja(lojista);
            Coordinates origem = geoLocalizacaoClient.buscarCoordenadas(cepOrigem);

            double dsitanciaKm = CalculadoraDistancia.calcularKm(origem, destino);
            total = total.add(mapearFaixaDePreco(dsitanciaKm));
        }
        return total;
    }

    private String buscarCepOrigemLoja(Lojista lojista) {
        return enderecoRepository.findByUsuarioIdAndPrincipalTrue(lojista.getUsuario().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                       "Logista '" + lojista.getNomeLoja() + "' não tem endereço principal cadastrado" ))
                .getCep();
    }

    private BigDecimal mapearFaixaDePreco(double distanciaKm) {
        if (distanciaKm <= 100) return BigDecimal.valueOf(10.0);
        if (distanciaKm <= 500) return BigDecimal.valueOf(20.0);
        if (distanciaKm <= 1000) return BigDecimal.valueOf(30.0);
        if (distanciaKm <= 2000) return BigDecimal.valueOf(50.0);
        return BigDecimal.valueOf(100.0);
    }
}
