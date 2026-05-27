package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Mensagem;
import com.ayvy.api_java.infrastructure.repositories.MensagemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

//????????????????????? USAREMOS ISSO COMO ENTIDADE? ???????????????

@Service

public class MensagemService {

    private final MensagemRepository repository;

    public MensagemService(MensagemRepository repository) {this.repository = repository;}

    //CREATE
    public String salvarMensagem(Mensagem mensagem){
        repository.saveAndFlush(mensagem);
        return ("Mensagem Enviada");
    }

    //READ
    public Mensagem buscarMensagemPorTextoOuNome(String texto, String nome){
        return repository.findByTextoOrNome(texto, nome).orElseThrow(
                () -> new RuntimeException("Conversa não encontrada")
        );
    }

    public List<Mensagem> listarMensagens(){
        return repository.findAll();
    }

    //DELETE - por texto? por nome? seria a conversa toda?
    public String deletarMensagemPorId(Integer id){
        repository.deleteById(id);
        return ("Mensagem Apagada");
    }

    //UPDATE - ou Editar mensagem no futuro
    public String atualizarMensagemPorId(Integer id, Mensagem mensagem){
        Mensagem mensagemEntity = repository.findById(id).orElseThrow(
                () -> new RuntimeException("Mensagem não encontrada")
        );

        if(mensagem.getTexto() != null){
        mensagemEntity.setTexto(mensagem.getTexto());}

       repository.saveAndFlush(mensagemEntity);
        return ("Mensagem Editada");
    }

  /* ========= ! FORMA ANTIGA ! =============================================
        //Talvez possamos reomear para 'editada' depois
        Mensagem mensagemAtualizada = Mensagem.builder()
                .texto(mensagem.getTexto() != null ?
                        mensagem.getTexto() : mensagemEntity.getTexto())
                .nome(mensagemEntity.getNome())
                .dataEnvio(mensagemEntity.getDataEnvio())
                .dataRecebimento(mensagemEntity.getDataRecebimento())
                .id(mensagemEntity.getId())
                .build();
    }*/
}
