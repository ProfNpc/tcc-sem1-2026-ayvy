package com.ayvy.api_java.controller;



import com.ayvy.api_java.business.PagamentoService;
import com.ayvy.api_java.infrastructure.entities.Pagamento;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pagamentos")

public class PagamentoController {

    private final PagamentoService pagamentoService;


    public PagamentoController(PagamentoService pagamentoService) {this.pagamentoService = pagamentoService;}

    @PostMapping
    public ResponseEntity<Void> salvarPagamento(@RequestBody Pagamento pagamento) {
        pagamentoService.salvarPagamento(pagamento);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pagamento> buscarPagamentoPorId(@PathVariable Integer id){
        return ResponseEntity.ok(pagamentoService.buscarPagamentoPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Pagamento>> listarPagamentos(){
        return ResponseEntity.ok(pagamentoService.listarPagamentos());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPagamentoPorId(@PathVariable Integer id){
        pagamentoService.deletarPagamentoPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> atualizarPagamentoPorId(@PathVariable Integer id,
                                                        @RequestBody Pagamento pagamento){
        pagamentoService.atualizarPagamentoPorId(id, pagamento);
        return ResponseEntity.ok().build();
    }

}
