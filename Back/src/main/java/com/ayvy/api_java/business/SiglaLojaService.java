package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Gera a sigla da loja a partir do nome: iniciais das duas primeiras palavras
 * ("Loja Urbana" → "LU"). Se a sigla já existir em outra loja, recebe um número ("LU2").
 */
@Service
public class SiglaLojaService {

    private static final Set<String> PALAVRAS_IGNORADAS = Set.of("DE", "DA", "DO", "DAS", "DOS", "E", "A", "O", "THE");

    private final LojistaRepository lojistaRepository;

    public SiglaLojaService(LojistaRepository lojistaRepository) {
        this.lojistaRepository = lojistaRepository;
    }

    /** Preenche a sigla da loja se ainda não tiver. Retorna true se alterou. */
    public boolean garantirSigla(Lojista lojista) {
        if (lojista.getSigla() != null && !lojista.getSigla().isBlank()) return false;
        lojista.setSigla(gerarSiglaUnica(lojista.getNomeLoja()));
        return true;
    }

    public String gerarSiglaUnica(String nomeLoja) {
        String base = siglaBase(nomeLoja);
        String sigla = base;
        int sufixo = 2;
        while (lojistaRepository.existsBySigla(sigla)) {
            sigla = base + sufixo++;
        }
        return sigla;
    }

    static String siglaBase(String nomeLoja) {
        String limpo = Normalizer.normalize(nomeLoja == null ? "" : nomeLoja, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase()
                .replaceAll("[^A-Z0-9]+", " ")
                .trim();

        List<String> palavras = Arrays.stream(limpo.split(" "))
                .filter(p -> !p.isEmpty() && !PALAVRAS_IGNORADAS.contains(p))
                .toList();

        if (palavras.size() >= 2) {
            return "" + palavras.get(0).charAt(0) + palavras.get(1).charAt(0);
        }
        if (palavras.size() == 1) {
            String palavra = palavras.get(0);
            return palavra.length() >= 2 ? palavra.substring(0, 2) : palavra + "X";
        }
        return "LJ";
    }
}
