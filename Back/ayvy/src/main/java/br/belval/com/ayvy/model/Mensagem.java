package br.belval.com.ayvy.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Mensagem {

	private Integer id;
	private String nome;
	private String texto;
	private LocalDateTime data_envio;
	private LocalDateTime data_recebimento;

	public Mensagem() {

	}

	public Integer getId() {
		return this.id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getTexto() {
		return texto;
	}

	public void setTexto(String texto) {
		this.texto = texto;
	}

	public LocalDateTime getData_envio() {
		return data_envio;
	}

	public void setData_envio(LocalDateTime data_envio) {
		this.data_envio = data_envio;
	}

	public LocalDateTime getData_recebimento() {
		return data_recebimento;
	}

	public void setData_recebimento(LocalDateTime data_recebimento) {
		this.data_recebimento = data_recebimento;
	}

	@Override
	public int hashCode() {
		return Objects.hash(id);
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Mensagem other = (Mensagem) obj;
		return Objects.equals(id, other.id);
	}

	@Override
	public String toString() {
		return "Mensagem [id=" + id + ", nome=" + nome + ", texto=" + texto + ", data_envio=" + data_envio
				+ ", data_recebimento=" + data_recebimento + "]";
	}

}
