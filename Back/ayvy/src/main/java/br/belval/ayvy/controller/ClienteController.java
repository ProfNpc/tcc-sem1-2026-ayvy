package br.belval.ayvy.controller;

import java.util.Optional;

import org.apache.catalina.startup.ClassLoaderFactory.Repository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

import br.belval.com.ayvy.model.Cliente;

public class ClienteController {

	@DeleteMapping("/produtos/{id}")
	public ResponseEntity<String> apagarCliente(@PathVariable Integer id) {
	
	Optional<Cliente> clienteOpt = Repository.findById(id);
	
	if (clienteOpt.isEmpty()) {
		return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body("Cliente não encontrado!");
	}
	
	Repository.deleteById(id);
	
	return ResponseEntity
			.status(HttpStatus.OK)
			.body("Cliente apagado com sucesso!");
		
	}
	
}
