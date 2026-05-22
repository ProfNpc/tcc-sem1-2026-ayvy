package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Cliente;
import com.ayvy.api_java.infrastructure.entities.Usuario;
import com.ayvy.api_java.infrastructure.enums.PapelUsuario;
import com.ayvy.api_java.infrastructure.enums.StatusUsuario;
import com.ayvy.api_java.infrastructure.repositories.ClienteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class ClienteService {

    //Injetando o Repository manualmente aqui no service
    private final ClienteRepository repository;
    private final UsuarioService usuarioService;

    public ClienteService(
            ClienteRepository repository, UsuarioService usuarioService) {
        this.repository = repository;
        this.usuarioService = usuarioService;
    }

    //CRIANDO O CRUD:
    //Create
    //Read
    //Update
    //Delete


    //'void' é que não retorna nada:
    //Aqui é a parte de 'CREATE'
    public Cliente salvarCliente(Cliente cliente){

        //Salvando de forma automática como ATIVO e trazendo o que for cliente.
        cliente.getUsuario().setPapel(PapelUsuario.CLIENTE);
        cliente.getUsuario().setStatus(StatusUsuario.ATIVO);

        Usuario usuarioSalvo = usuarioService.salvarUsuario(cliente.getUsuario());

        cliente.setUsuario(usuarioSalvo);

        return repository.saveAndFlush(cliente);
        //'saveAndFlush' = salva e força sincronização com BD
    }

    //buscar cliente por email 'READ'
    public Cliente buscarClientePorId(Integer id){

        return repository.findById(id).orElseThrow(
                //Uma exceção personalizada:
                () -> new RuntimeException("Cliente não encontrado")
        );
    }

    public List<Cliente> listarClientes(){
        return repository.findAll();
    }

    //deletar cliente por Id 'DELETE' --> função ANTERIOR criada no repository
    public void deletarClientePorId (Integer id){
        repository.deleteById(id);
    }

    //Atualizar os dados do cliente 'Update':
    public Cliente atualizarClientePorId(Integer id, Cliente cliente){
        Cliente clienteEntity = repository.findById(id).orElseThrow(
                () -> new RuntimeException("Usuário/cliente não encontrado")
        );

        if(cliente.getDataNascimento()!=null) {
            clienteEntity.setDataNascimento(cliente.getDataNascimento());
        }
        if(cliente.getCpf()!=null) {
            clienteEntity.setCpf(cliente.getCpf());
        }

       return repository.saveAndFlush(clienteEntity);
      //  return ("Alterações salvas com sucesso!");
    }

        /* ========= ! FORMA ANTIGA ! =============================================
        Cliente clienteAtualizado = Cliente.builder()
                .email(cliente.getEmail() != null ?
                        cliente.getEmail() : clienteEntity.getEmail())

                .nome(cliente.getNome() != null ?
                        cliente.getNome() : clienteEntity.getNome())

                .dataNascimento(cliente.getDataNascimento() != null ?
                        cliente.getDataNascimento() : clienteEntity.getDataNascimento())

                .telefone(cliente.getTelefone() != null ?
                        cliente.getTelefone() : clienteEntity.getTelefone())

                .senha(cliente.getSenha() != null ?
                        cliente.getSenha() : clienteEntity.getSenha())

                //CPF e Id não serão alterados:
                .cpf(clienteEntity.getCpf())
                .id(clienteEntity.getId())
                .build();

        repository.saveAndFlush(clienteAtualizado);
    }*/

}
