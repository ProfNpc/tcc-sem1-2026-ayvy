package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.ClienteService;
import com.ayvy.api_java.infrastructure.entities.Cliente;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
//A uri:
//Vai fazer requisições pela 'localhost:8080/clientes'
@RequestMapping("/clientes")

public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    //Para gravar dados:
    @PostMapping
    public ResponseEntity<Void> salvarCliente(@RequestBody Cliente cliente) {  //Necessário alterar para DTO
        clienteService.salvarCliente(cliente);
        return ResponseEntity.ok().build();
    }

    //Para buscar:
    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarClientePorId(@PathVariable Integer id) {
        return ResponseEntity.ok(clienteService.buscarClientePorId(id));
    }

    @GetMapping
    public ResponseEntity <List<Cliente>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    //Para deletar:
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarClientePorId(@PathVariable Integer id){
        clienteService.deletarClientePorId(id);
        return ResponseEntity.ok().build();
    }

    //Fazer alterações em TODOS os campos:
    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizarClientePorId(@PathVariable Integer id,
                                                      @RequestBody Cliente cliente){
        //Adicionar para retornar o Cliente Atualizado

        clienteService.atualizarClientePorId(id, cliente);
        return ResponseEntity.ok().build();
    }

}

