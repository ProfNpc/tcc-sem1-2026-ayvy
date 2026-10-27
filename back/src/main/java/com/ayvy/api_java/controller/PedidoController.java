package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.PedidoService;
import com.ayvy.api_java.dto.CheckoutRequest;
import com.ayvy.api_java.dto.EnvioRequest;
import com.ayvy.api_java.infrastructure.entities.HistoricoCompras;
import com.ayvy.api_java.infrastructure.entities.Pedido;
import com.ayvy.api_java.infrastructure.entities.PedidoEnderecoEntrega;
import com.ayvy.api_java.infrastructure.entities.PedidoProdutos;
import com.ayvy.api_java.infrastructure.enums.StatusPedido;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rotas de /pedidos: checkout, listagens, itens, endereço, histórico e todo o fluxo de envio
 * (status, /recebido, /envio, /entrega-confirmada) e busca pelo código da loja (/codigo/LU-1).
 * Front: pedidosApi.js (cliente, checkout, admin) e lojistaApi.js (ações do lojista na aba Pedidos).
 * Regras e notificações: PedidoService.
 */
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

    @PostMapping("/checkout")
    public ResponseEntity<Pedido> checkout(@RequestBody CheckoutRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.finalizarCheckout(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPedidoPorId(@PathVariable int id){
        return ResponseEntity.ok(pedidoService.buscarPedidoPorId(id));
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Pedido> buscarPedidoPorCodigo(@PathVariable String codigo){
        return ResponseEntity.ok(pedidoService.buscarPedidoPorCodigo(codigo));
    }

    @GetMapping("/{id}/endereco-entrega")
    public ResponseEntity<PedidoEnderecoEntrega> buscarPedidosPorId(@PathVariable Integer id){
        PedidoEnderecoEntrega endereco = pedidoService.buscarEnderecoPorPedidoId(id);
        return ResponseEntity.ok(endereco);
    }

    @GetMapping
    public ResponseEntity<List<Pedido>> listarPedidosPorUsuario(@RequestParam(required = false) Integer usuarioId){
        if (usuarioId != null) {
            return ResponseEntity.ok(pedidoService.listarPedidosPorUsuario(usuarioId));
        }
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Pedido>> listarPedidos(){
        return ResponseEntity.ok(pedidoService.listarPedidos());
    }

    @GetMapping("/{id}/itens")
    public ResponseEntity<List<PedidoProdutos>> listarItensDoPedido(@PathVariable Integer id){
     return ResponseEntity.ok(pedidoService.listarItensPorPedidoId(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarPedidoPorId(@PathVariable int id){
        pedidoService.deletarPedidoPorId(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Pedido> atualizarStatus(@PathVariable Integer id,
                                                  @RequestParam StatusPedido novoStatus,
                                                  @RequestParam(required = false) Integer actorUsuarioId) {
        return ResponseEntity.ok(pedidoService.atualizarStatus(id, novoStatus, actorUsuarioId));
    }

    @PutMapping("/{id}/recebido")
    public ResponseEntity<Pedido> confirmarRecebimento(@PathVariable Integer id,
                                                       @RequestParam(required = false) Integer actorUsuarioId) {
        return ResponseEntity.ok(pedidoService.confirmarRecebimento(id, actorUsuarioId));
    }

    @PutMapping("/{id}/envio")
    public ResponseEntity<Pedido> registrarEnvio(@PathVariable Integer id, @RequestBody EnvioRequest request) {
        return ResponseEntity.ok(pedidoService.registrarEnvio(id, request));
    }

    @PutMapping("/{id}/entrega-confirmada")
    public ResponseEntity<Pedido> confirmarEntrega(@PathVariable Integer id, @RequestParam Integer usuarioId) {
        return ResponseEntity.ok(pedidoService.confirmarEntregaPeloCliente(id, usuarioId));
    }

    @GetMapping("/{id}/historico")
    public ResponseEntity<List<HistoricoCompras>> listarHistoricoDoPedido(@PathVariable Integer id){
        return ResponseEntity.ok(pedidoService.listarHistoricoPorPedidoId(id));
    }

    /* !!! EXPLICAÇÃO NA SERVICE =================================
    @PutMapping
    public ResponseEntity<Void> atualizarPedidoPorId(@RequestParam int id,
                                                    @RequestBody Pedido pedido) {
        pedidoService.atualizarPedidoPorId(id, pedido);
        return ResponseEntity.ok().build();
    }*/

}
