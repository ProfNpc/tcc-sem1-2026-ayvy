package com.ayvy.api_java.controller;

import com.ayvy.api_java.business.CarrinhoService;
import com.ayvy.api_java.dto.CarrinhoItemRequest;
import com.ayvy.api_java.infrastructure.entities.CarrinhoItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Rotas de /carrinho: o carrinho da conta, o mesmo no site e no app.
 * GET lê, PUT substitui pelo carrinho inteiro e DELETE esvazia.
 * Front: ayvy-react/src/services/carrinhoApi.js (CartContext). App: mobile/login-app/api.js (CartContext.js).
 */
@RestController
@RequestMapping("/carrinho")
public class CarrinhoController {

    private final CarrinhoService carrinhoService;

    public CarrinhoController(CarrinhoService carrinhoService) {
        this.carrinhoService = carrinhoService;
    }

    @GetMapping
    public ResponseEntity<List<CarrinhoItem>> listar(@RequestParam Integer usuarioId) {
        return ResponseEntity.ok(carrinhoService.listar(usuarioId));
    }

    @PutMapping
    public ResponseEntity<List<CarrinhoItem>> substituir(@RequestParam Integer usuarioId,
                                                         @RequestBody List<CarrinhoItemRequest> itens) {
        return ResponseEntity.ok(carrinhoService.substituir(usuarioId, itens));
    }

    @DeleteMapping
    public ResponseEntity<Void> limpar(@RequestParam Integer usuarioId) {
        carrinhoService.limpar(usuarioId);
        return ResponseEntity.noContent().build();
    }
}
