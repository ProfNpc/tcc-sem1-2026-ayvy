package br.belval.com.ayvy;

import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Entrega {
	
	private Integer id;
	private String status;
	private LocalDateTime dataEnvio;
	

public Entrega() {
	
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

public LocalDateTime getDataEnvio() {
	return dataEnvio;
}

public void setDataEnvio(LocalDateTime dataEnvio) {
	this.dataEnvio = dataEnvio;
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
	Entrega other = (Entrega) obj;
	return Objects.equals(id, other.id);
}

@Override
public String toString() {
	return "Entrega [id=" + id + ", status=" + status + ", dataEnvio=" + dataEnvio + "]";
}
public static void main(String[]args) {
	Entrega p = new Entrega();
	p.setId(223);
	System.out.println(p.toString());
}

}
