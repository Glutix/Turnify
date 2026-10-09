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
import { CategoriasProductoService } from "./categorias-producto.service";
import { CrearCategoriaProductoDto } from "./dto/crear-categoria-producto.dto";
import { ActualizarCategoriaProductoDto } from "./dto/actualizar-categoria-producto.dto";
import { SoloAdmin } from "../auth/decorators/auth.decorators";

@ApiTags("categorias-producto")
@Controller("categorias-producto")
export class CategoriasProductoController {
  constructor(
    private readonly categoriasProductoService: CategoriasProductoService,
  ) {}

  @Get()
  findAll() {
    return this.categoriasProductoService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.categoriasProductoService.findOne(id);
  }

  @SoloAdmin()
  @Post()
  create(@Body() dto: CrearCategoriaProductoDto) {
    return this.categoriasProductoService.create(dto);
  }

  @SoloAdmin()
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ActualizarCategoriaProductoDto,
  ) {
    return this.categoriasProductoService.update(id, dto);
  }

  @SoloAdmin()
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categoriasProductoService.remove(id);
  }
}
