package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusLoja;
import com.ayvy.api_java.infrastructure.repositories.LojistaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LojistaService {

    private final LojistaRepository repository;
    private final UsuarioService usuarioService;

    public LojistaService(LojistaRepository Repository, UsuarioService usuarioService) {
        this.repository = Repository;
        this.usuarioService = usuarioService;
    }

    //Aprovar manualmente o lojista.
    public void aprovarLojista(Integer id){

        Lojista lojista = repository.findById(id)
                .orElseThrow();

        lojista.setStatus(StatusLoja.APROVADO);

        lojista.setAprovadoEm(LocalDateTime.now());

        repository.save(lojista);
    }

    //CRUD

    public Lojista salvarLojista(Lojista lojista){
        lojista.getUsuario().setPapel(PapelUsuario.LOJISTA);
        lojista.setStatus(StatusLoja.PENDENTE);

        Usuario usuarioSalvo = usuarioService.salvarUsuario(lojista.getUsuario());

        lojista.setUsuario(usuarioSalvo);

        return repository.saveAndFlush(lojista);

    }

    public Lojista buscarLojistaPorId(Integer id){

        return repository.findById(id).orElseThrow(
                () -> new RuntimeException("Lojista não encontrado.")
        );
    }

    public List<Lojista> listarLojistas(){
        return repository.findAll();
    }

    public void deletarLojistaPorId(Integer id){
        repository.deleteById(id);
    }

    public Lojista atualizarLojistaPorId (Integer id, Lojista lojista){
        Lojista lojistaEntity = buscarLojistaPorId(id);

        if(lojista.getNomeLoja()!=null) {
            lojistaEntity.setNomeLoja(lojista.getNomeLoja());
        }
        if(lojista.getCnpj()!=null) {
            lojistaEntity.setCnpj(lojista.getCnpj());
        }

        return repository.saveAndFlush(lojistaEntity);

    }


}
