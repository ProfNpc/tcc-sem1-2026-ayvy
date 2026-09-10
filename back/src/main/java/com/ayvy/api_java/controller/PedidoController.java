package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.PedidoService;
import com.ayvy.api_java.dto.CheckoutRequest;
import com.ayvy.api_java.infrastructure.entities.Pedido;
import com.ayvy.api_java.infrastructure.entities.PedidoEnderecoEntrega;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pedidos")

public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {this.pedidoService = pedidoService;}

    @PostMapping
    public ResponseEntity<Void> salvarPedido(@RequestBody Pedido pedido) {
        pedidoService.salvarPedido(pedido);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<Pedido> checkout(@RequestBody CheckoutRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.finalizarCheckout(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPedidoPorId(@PathVariable int id){
        return ResponseEntity.ok(pedidoService.buscarPedidoPorId(id));
    }

    @GetMapping("/{id}/endereco-entrega")
    public ResponseEntity<PedidoEnderecoEntrega> buscarPedidosPorId(@PathVariable Integer id){
        PedidoEnderecoEntrega endereco = pedidoService.bucarEnderecoPorPedidoId(id);
        return ResponseEntity.ok(endereco);
    }

    @GetMapping
    public ResponseEntity<List<Pedido>> listarPedidosPorUsuario(@RequestParam(required = false) Integer usuarioId){
        if (usuarioId != null) {
            return ResponseEntity.ok(pedidoService.listarPedidosPorUsuario(usuarioId));
        }
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    @GetMapping
    public ResponseEntity<List<Pedido>> listarPedidos(){
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    @GetMapping("/{id}/itens")
    public ResponseEntity<List<PedidoProdutos>> listarPedidosDoPedido(@PathVariable Integer id){
     return ResponseEntity.ok(pedidoService.listarItensPorPedidoId(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPedidoPorId(@PathVariable int id){
        pedidoService.deletarPedidoPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Pedido> atualizarStatus(@PathVariable Integer id, @RequestParam StatusPedido novoStatus) {
        return ResponseEntity.ok(pedidoService.atualizarStatus(id, novoStatus));
    }

    /* !!! EXPLICAÇÃO NA SERVICE =================================
    @PutMapping
    public ResponseEntity<Void> atualizarPedidoPorId(@RequestParam int id,
                                                    @RequestBody Pedido pedido) {
        pedidoService.atualizarPedidoPorId(id, pedido);
        return ResponseEntity.ok().build();
    }*/

}
