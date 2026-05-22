package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Pagamento;
import com.ayvy.api_java.infrastructure.repositories.PagamentoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class PagamentoService {

    private final PagamentoRepository repository;

    public PagamentoService(PagamentoRepository repository) {this.repository = repository;}

    //CREATE
    public void salvarPagamento(Pagamento pagamento){
        repository.saveAndFlush(pagamento);
    }

    //READ
    public Pagamento buscarPagamentoPorId(Integer id){
        return repository.findById(id).orElseThrow(
                () -> new RuntimeException("Pagamento não encontrado")
        );
    }

    public List<Pagamento> listarPagamentos(){
        return repository.findAll();
    }

    //DELETE
    public void deletarPagamentoPorId(Integer id){
        repository.deleteById(id);
    }

    //UPDATE
    public void atualizarPagamentoPorId(Integer id, Pagamento pagamento){
        Pagamento pagamentoEntity = buscarPagamentoPorId(id);

        if(pagamento.getTipo()!=null){
        pagamentoEntity.setTipo(pagamento.getTipo());}

        if(pagamento.getStatus()!=null){
            pagamentoEntity.setStatus(pagamento.getStatus());
        }

        //É permitido alterar o valor de pagamento? O do pedido é finalizado, logo não altera.
        // É necessário Entity Carrinho para essa alteração então?
        if(pagamento.getValor()!=null){
            pagamentoEntity.setValor(pagamento.getValor());
        }

        repository.saveAndFlush(pagamentoEntity);
    }
        /* ========= ! FORMA ANTIGA ! =============================================
        Pagamento pagamentoAtualizado = Pagamento.builder()
                .tipo(pagamento.getTipo() != null ?
                        pagamento.getTipo() : pagamentoEntity.getTipo())
                .status(pagamento.getStatus() != null ?
                        pagamento.getStatus() : pagamentoEntity.getStatus())
                .valor(pagamento.getValor() != null ?
                        pagamento.getValor() : pagamentoEntity.getValor())
                .dataPagamento(pagamentoEntity.getDataPagamento())
                .id(pagamentoEntity.getId())
                .build();

        repository.saveAndFlush(pagamentoAtualizado);
    }*/
}
