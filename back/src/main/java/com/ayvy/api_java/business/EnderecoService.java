package com.ayvy.api_java.business;

import com.ayvy.api_java.infrastructure.entities.Endereco;
import com.ayvy.api_java.infrastructure.repositories.EnderecoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EnderecoService {

    private final EnderecoRepository repository;

    public EnderecoService(EnderecoRepository repository) {
        this.repository = repository;
    }

    public Endereco salvarEndereco(Endereco endereco) {
        return repository.saveAndFlush(endereco);
    }

    public Endereco buscarEnderecoPorId(Integer id) {
        return repository.findById(id).orElseThrow(
                () -> new RuntimeException("Endereço não encontrado")
        );
    }

    public List<Endereco> listarEnderecos() {
        return repository.findAll();
    }

    public void deletarEnderecoPorId(Integer id) {
        repository.deleteById(id);
    }

    public Endereco atualizarEnderecoPorId(Integer id, Endereco endereco) {
        Endereco enderecoEntity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Endereço não encontrado"));

        if (endereco.getApelido() != null) {
            enderecoEntity.setApelido(endereco.getApelido());
        }
        if (endereco.getLogradouro() != null) {
            enderecoEntity.setLogradouro(endereco.getLogradouro());
        }
        if (endereco.getNumero() != null) {
            enderecoEntity.setNumero(endereco.getNumero());
        }
        if (endereco.getComplemento() != null) {
            enderecoEntity.setComplemento(endereco.getComplemento());
        }
        if (endereco.getBairro() != null) {
            enderecoEntity.setBairro(endereco.getBairro());
        }
        if (endereco.getCidade() != null) {
            enderecoEntity.setCidade(endereco.getCidade());
        }
        if (endereco.getUf() != null) {
            enderecoEntity.setUf(endereco.getUf());
        }
        if (endereco.getCep() != null) {
            enderecoEntity.setCep(endereco.getCep());
        }
        if (endereco.getPrincipal() != null) {
            enderecoEntity.setPrincipal(endereco.getPrincipal());
        }

        return repository.saveAndFlush(enderecoEntity);
    }
}
