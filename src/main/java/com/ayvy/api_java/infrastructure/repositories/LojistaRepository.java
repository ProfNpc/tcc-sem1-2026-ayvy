package com.ayvy.api_java.infrastructure.repositories;

import com.ayvy.api_java.infrastructure.entities.Lojista;
import com.ayvy.api_java.infrastructure.enums.StatusLoja;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LojistaRepository extends JpaRepository<Lojista, Integer> {



}
