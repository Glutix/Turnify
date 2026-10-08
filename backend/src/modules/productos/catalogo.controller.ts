import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProductosService } from "./productos.service";

@ApiTags("catalogo")
@Controller("catalogo")
export class CatalogoController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  findAll() {
    return this.productosService.findAllCatalogo();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productosService.findOneCatalogo(id);
  }
}
