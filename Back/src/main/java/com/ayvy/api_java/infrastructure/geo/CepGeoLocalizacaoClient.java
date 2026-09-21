package com.ayvy.api_java.infrastructure.geo;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

@Component
public class CepGeoLocalizacaoClient {

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://brasilapi.com.br/api/cep/v2")
            .build();

    public Coordinates buscarCoordenadas(String cep){
        String cepLimpo = cep.replaceAll("\\D","");

        JsonNode root;
        try {
            root = restClient.get()
                    .uri("/{cep}", cepLimpo)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível consultar o CEP " + cep + " no serviço de geolocalização");
        }
        JsonNode coordenadas = root == null ? null : root.path("location").path("coordinates");
        if(coordenadas == null || coordenadas.isMissingNode()
                || coordenadas.path("latitude").isMissingNode()
                || coordenadas.path("longitude").isMissingNode()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "CEP " + cep + " não possui coordenadas cadastradas para cálculo de frete");
        }

        double lat = coordenadas.path("latitude").asDouble();
        double lon = coordenadas.path("longitude").asDouble();
        return new Coordinates(lat, lon);
    }
}
