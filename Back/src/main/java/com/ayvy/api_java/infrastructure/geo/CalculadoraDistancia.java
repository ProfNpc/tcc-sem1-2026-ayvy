package com.ayvy.api_java.infrastructure.geo;

public final class CalculadoraDistancia {

    // FÓRMULA DE HAVERSINE
    private static final double RAIO_TERRA_KM = 6371.0;

    private CalculadoraDistancia() {}

    public static double calcularKm(Coordinates origem, Coordinates destino) {
        double dLat = Math.toRadians(destino.latitude() - origem .latitude());
        double dLon = Math.toRadians(destino.longitude() - origem.longitude());

        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.toRadians(origem.latitude())) *Math.cos(Math.toRadians(destino.latitude())) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return RAIO_TERRA_KM * c;
    }
}
