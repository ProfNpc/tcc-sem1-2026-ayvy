package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.ClienteService;
import com.ayvy.api_java.dto.ClienteCreateRequest;
import com.ayvy.api_java.infrastructure.entities.Cliente;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    public ResponseEntity<Cliente> salvarCliente(@RequestBody ClienteCreateRequest request) {
        Cliente cliente = clienteService.salvarCliente(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cliente);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarClientePorId(@PathVariable Integer id) {
        return ResponseEntity.ok(clienteService.buscarClientePorId(id));
    }

    @GetMapping
    public ResponseEntity<List<Cliente>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarClientePorId(@PathVariable Integer id) {
        clienteService.deletarClientePorId(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizarClientePorId(
            @PathVariable Integer id,
            @RequestBody Cliente cliente
    ) {
        return ResponseEntity.ok(clienteService.atualizarClientePorId(id, cliente));
    }
}
