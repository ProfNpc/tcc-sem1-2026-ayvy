package br.belval.com.ayvy.model;
 
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
 
public class Pagamento {
 
	private Integer id;
	private BigDecimal valor;
	private String tipo;
	private String status;
	private LocalDateTime data;
 
	public Pagamento() {
 
	}
 
	public Integer getId() {
		return this.id;
	}
 
	public void setId(Integer id) {
		this.id = id;
	}
 
	public BigDecimal getValor() {
		return this.valor;
	}
 
	public void setValor(BigDecimal valor) {
		this.valor = valor;
	}	
	
	public String getTipo() {
		return this.tipo;
	}
 
	public void settipo(String tipo) {
		this.tipo = tipo;
	}
	
	public String getStatus() {
		return this.status;
	}
 
	public void setStatus(String status) {
		this.status = status;
	}
 
		public LocalDateTime getData() {
			return this.data;
		}
 
		public void setData(LocalDateTime data) {
			this.data = data;
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
			Pagamento other = (Pagamento) obj;
			return Objects.equals(id, other.id);
		}
 
		@Override
		public String toString() {
			return "Pagamento [id=" + id + ", valor=" + valor + ", tipo=" + tipo + ", status=" + status + ", data="
					+ data + "]";
		}
		
		public static void main(String[] args  ) {
			Pagamento p = new Pagamento();
			p.setId(223);
			Integer id = p.getId();
			System.out.println(p.toString());
			
		}
		
}
 
 
 
 
 
 