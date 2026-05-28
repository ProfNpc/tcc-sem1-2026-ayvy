package br.belval.com.ayvy.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.belval.com.ayvy.model.Produto;
import br.belval.com.ayvy.repository.ProdutoRepository;

@RestController
public class ProdutoController {

	@Autowired
	private ProdutoRepository produtoRepository;

	// Define a pasta raiz do projeto onde as imagens serão salvas
	private static final String UPLOAD_DIRECTORY = "upload-dir";

	// 1. Listar todos os produtos
	@GetMapping("/api/produtos")
	public List<Produto> listarTodos() {
		return produtoRepository.findAll();
	}

	// 2. Endpoint de CADASTRAR PRODUTO COM UPLOAD DE IMAGEM
	@PostMapping("/api/produtos")
	public ResponseEntity<?> criarComImagem(@RequestParam("nome") String nome,
			@RequestParam("imagem") MultipartFile arquivo) {

		try {
			// Cria o diretório se ele não existir
			Path pastaUpload = Paths.get(UPLOAD_DIRECTORY);
			if (!Files.exists(pastaUpload)) {
				Files.createDirectories(pastaUpload);
			}

			// Define um nome único para o arquivo usando o timestamp atual
			String nomeArquivoOriginal = arquivo.getOriginalFilename();
			String extensao = nomeArquivoOriginal.substring(nomeArquivoOriginal.lastIndexOf("."));
			String nomeUnicoArquivo = System.currentTimeMillis() + extensao;

			// Salva o arquivo fisicamente na pasta do servidor
			Path caminhoArquivo = pastaUpload.resolve(nomeUnicoArquivo);
			Files.copy(arquivo.getInputStream(), caminhoArquivo);

			// Cria o objeto Produto e salva o nome da imagem nele
			Produto produto = new Produto();
			produto.setNome(nome);
			produto.setImagemUrl(nomeUnicoArquivo);

			Produto novoProduto = produtoRepository.save(produto);
			return new ResponseEntity<>(novoProduto, HttpStatus.CREATED);

		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Erro ao salvar o arquivo: " + e.getMessage());
		}
	}

	// 3. Endpoint de LEITURA DA IMAGEM (Retorna os bytes para a tag <img
	// src="...">)
	@GetMapping(value = "/img/{id}", produces = { MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE })
	public ResponseEntity<byte[]> exibirImagem(@PathVariable Long id) {

		// Busca o produto pelo ID no banco
		Optional<Produto> produtoOptional = produtoRepository.findById(id);

		if (produtoOptional.isEmpty() || produtoOptional.get().getImagemUrl() == null) {
			return ResponseEntity.notFound().build();
		}

		try {
			// Busca o arquivo físico na pasta usando o nome guardado no banco
			String nomeImagem = produtoOptional.get().getImagemUrl();
			Path caminhoArquivo = Paths.get(UPLOAD_DIRECTORY).resolve(nomeImagem);

			if (Files.exists(caminhoArquivo)) {
				byte[] bytesImagem = Files.readAllBytes(caminhoArquivo);
				return ResponseEntity.ok().body(bytesImagem);
			}

			return ResponseEntity.notFound().build();

		} catch (IOException e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
}
