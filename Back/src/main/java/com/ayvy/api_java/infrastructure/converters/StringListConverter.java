package com.ayvy.api_java.infrastructure.converters;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.List;

/**
 * Guarda List<String> como texto separado por vírgula (ex.: "Preto,Branco").
 * null no banco → null no Java (produto sem variações cadastradas);
 * "" no banco → lista vazia (lojista removeu todas).
 */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SEPARADOR = ",";

    @Override
    public String convertToDatabaseColumn(List<String> lista) {
        if (lista == null) {
            return null;
        }
        return String.join(SEPARADOR, lista.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.trim().replace(SEPARADOR, " "))
                .distinct()
                .toList());
    }

    @Override
    public List<String> convertToEntityAttribute(String valor) {
        if (valor == null) {
            return null;
        }
        if (valor.isBlank()) {
            return List.of();
        }
        return Arrays.stream(valor.split(SEPARADOR))
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .toList();
    }
}
