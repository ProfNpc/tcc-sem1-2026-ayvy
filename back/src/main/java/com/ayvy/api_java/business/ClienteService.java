package com.ayvy.api_java.business;

import com.ayvy.api_java.dto.ClienteCreateRequest;
import com.ayvy.api_java.infrastructure.entities.Cliente;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.repositories.ClienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository repository;
    private final UsuarioService usuarioService;

    public ClienteService(ClienteRepository repository, UsuarioService usuarioService) {
        this.repository = repository;
        this.usuarioService = usuarioService;
    }

    /**
     * Cria perfil de cliente para um usuário já cadastrado com papel {@code cliente}.
     * Fluxo: POST /usuarios (papel cliente) → POST /clientes (usuarioId + cpf).
     */
    public Cliente salvarCliente(ClienteCreateRequest request) {
        validarRequest(request);
        usuarioService.validarUsuarioParaPerfil(request.getUsuarioId(), PapelUsuario.cliente);

        Usuario usuario = usuarioService.buscarUsuarioPorId(request.getUsuarioId());

        Cliente cliente = Cliente.builder()
                .usuario(usuario)
                .cpf(request.getCpf())
                .dataNascimento(request.getDataNascimento())
                .build();

        return repository.saveAndFlush(cliente);
    }

    public Cliente buscarClientePorId(Integer id) {
        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado")
        );
    }

    public List<Cliente> listarClientes() {
        return repository.findAll();
    }

    public void deletarClientePorId(Integer id) {
        repository.deleteById(id);
    }

    public Cliente atualizarClientePorId(Integer id, Cliente cliente) {
        Cliente clienteEntity = buscarClientePorId(id);

        if (cliente.getDataNascimento() != null) {
            clienteEntity.setDataNascimento(cliente.getDataNascimento());
        }
        if (cliente.getCpf() != null) {
            clienteEntity.setCpf(cliente.getCpf());
        }

        return repository.saveAndFlush(clienteEntity);
    }

    private void validarRequest(ClienteCreateRequest request) {
        if (request.getUsuarioId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'usuarioId' é obrigatório");
        }
        if (request.getCpf() == null || request.getCpf().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Campo 'cpf' é obrigatório");
        }
    }
}
