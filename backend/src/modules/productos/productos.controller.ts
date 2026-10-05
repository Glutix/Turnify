import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProductosService } from "./productos.service";
import { CrearProductoDto } from "./dto/crear-producto.dto";
import { ActualizarProductoDto } from "./dto/actualizar-producto.dto";
import { ActualizarStockProductoDto } from "./dto/actualizar-stock-producto.dto";
import { SoloAdmin } from "../auth/decorators/auth.decorators";

@ApiTags("productos")
@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @SoloAdmin()
  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @SoloAdmin()
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @SoloAdmin()
  @Post()
  create(@Body() dto: CrearProductoDto) {
    return this.productosService.create(dto);
  }

  @SoloAdmin()
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @SoloAdmin()
  @Patch(":id/stock")
  actualizarStock(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarStockProductoDto,
  ) {
    return this.productosService.actualizarStock(id, dto);
  }

  @SoloAdmin()
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
