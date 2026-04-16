package br.belval.com.ayvy.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

public class Pedido {
	
	private Integer id;
	private String status;
	private BigDecimal valor;
	private LocalDateTime dataPedido;
	
	public Pedido() {
		
	}
	
	public Integer getId() {
		return this.id;	
	}
	
	public void setId(Integer id) {
		this.id = id;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public BigDecimal getValor() {
		return valor;
	}

	public void setValor(BigDecimal valor) {
		this.valor = valor;
	}

	public LocalDateTime getDataPedido() {
		return dataPedido;
	}

	public void setDataPedido(LocalDateTime dataPedido) {
		this.dataPedido = dataPedido;
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
		Pedido other = (Pedido) obj;
		return Objects.equals(id, other.id);
	}

	@Override
	public String toString() {
		return "Pedido [id=" + id + ", status=" + status + ", valor=" + valor + ", dataPedido=" + dataPedido + "]";
	}
	
	public static void main(String[]args) {
		Pedido p = new Pedido();
		p.setId(223);
		System.out.println(p.toString());

	}

}
