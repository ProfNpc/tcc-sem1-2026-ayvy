package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Categoria;
import com.ayvy.api_java.infrastructure.repositories.CategoriaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoriaService {

    private final CategoriaRepository repository;

    public CategoriaService(CategoriaRepository repository) {this.repository = repository;}

    //CREATE
    public void salvarCategoria(Categoria categoria){
        repository.saveAndFlush(categoria);
    }

    //READ
    public Categoria buscarCategoriaPorNomeCategoria(String nomeCategoria){

        return repository.findByNomeCategoria(nomeCategoria).orElseThrow(
                //Uma exceção personalizada:
                () -> new RuntimeException("Categoria não encontrada")
        );
    }

    public List<Categoria> listarCategorias(){
        return repository.findAll();
    }

    //DELETE
    public void deletarCategoriaPorId(Integer id) {
        repository.deleteById(id);
    }


//UPDATE
     public Categoria atualizarCategoriaPorId(Integer id, Categoria categoria){
         Categoria categoriaEntity = repository.findById(id).orElseThrow(
                 () -> new RuntimeException("Categoria não encontrada")
         );

         if(categoria.getNomeCategoria() != null){
         categoriaEntity.setNomeCategoria(categoria.getNomeCategoria());}

         return repository.saveAndFlush(categoriaEntity);
     }
          /* ========= ! FORMA ANTIGA ! =============================================
         Categoria categoriaAtualizado = Categoria.builder()
                 .id(categoriaEntity.getId())
                 .nomeCategoria(categoria.getNomeCategoria() != null ?
                         categoria.getNomeCategoria() : categoriaEntity.getNomeCategoria())
                 .build();

         repository.saveAndFlush(categoriaAtualizado);
      }*/

}
