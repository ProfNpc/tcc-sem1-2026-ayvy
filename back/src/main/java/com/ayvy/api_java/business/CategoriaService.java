package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Categoria;
import com.ayvy.api_java.infrastructure.repositories.CategoriaRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class CategoriaService {

    private final CategoriaRepository repository;

    public CategoriaService(CategoriaRepository repository) {
        this.repository = repository;
    }

    public void salvarCategoria(Categoria categoria) {
        if (categoria.getSlug() == null || categoria.getSlug().isBlank()) {
            categoria.setSlug(gerarSlug(categoria.getNome()));
        }
        if (categoria.getAtivo() == null) {
            categoria.setAtivo(true);
        }
        repository.saveAndFlush(categoria);
    }

    public Categoria buscarCategoriaPorNome(String nome) {
        return repository.findByNome(nome).orElseThrow(
                () -> new RuntimeException("Categoria não encontrada")
        );
    }

    public List<Categoria> listarCategorias() {
        return repository.findAll();
    }

    public void deletarCategoriaPorId(Integer id) {
        repository.deleteById(id);
    }

    public Categoria atualizarCategoriaPorId(Integer id, Categoria categoria) {
        Categoria categoriaEntity = repository.findById(id).orElseThrow(
                () -> new RuntimeException("Categoria não encontrada")
        );

        if (categoria.getNome() != null) {
            categoriaEntity.setNome(categoria.getNome());
        }
        if (categoria.getSlug() != null) {
            categoriaEntity.setSlug(categoria.getSlug());
        }
        if (categoria.getAtivo() != null) {
            categoriaEntity.setAtivo(categoria.getAtivo());
        }

        return repository.saveAndFlush(categoriaEntity);
    }

    private static String gerarSlug(String nome) {
        if (nome == null) {
            return "";
        }
        String normalizado = Normalizer.normalize(nome, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return normalizado.replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
