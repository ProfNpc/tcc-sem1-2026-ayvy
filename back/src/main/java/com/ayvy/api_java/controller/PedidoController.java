package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.PedidoService;
import com.ayvy.api_java.infrastructure.entities.Pedido;
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

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPedidoPorId(@PathVariable int id){
        return ResponseEntity.ok(pedidoService.buscarPedidoPorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Pedido>> listarPedidos(){
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPedidoPorId(@PathVariable int id){
        pedidoService.deletarPedidoPorId(id);
        return ResponseEntity.ok().build();
    }

    /* !!! EXPLICAÇÃO NA SERVICE =================================
    @PutMapping
    public ResponseEntity<Void> atualizarPedidoPorId(@RequestParam int id,
                                                    @RequestBody Pedido pedido) {
        pedidoService.atualizarPedidoPorId(id, pedido);
        return ResponseEntity.ok().build();
    }*/

}
