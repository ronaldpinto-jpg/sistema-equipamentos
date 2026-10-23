# EquipTrack — Gerenciador de equipamentos

Sistema web para cadastrar, consultar, pesquisar, editar, excluir e alterar o status de equipamentos de informática.

## Como executar
1. Extraia a pasta do projeto.
2. Abra `index.html` no navegador. Para desenvolvimento, também pode usar a extensão Live Server do VS Code.
3. Os dados são salvos no `LocalStorage` do navegador utilizado.

## Funcionalidades
- Painel com totais de equipamentos disponíveis, emprestados e em manutenção.
- Cadastro e edição de equipamentos.
- Validação de campos obrigatórios e número de patrimônio duplicado.
- Pesquisa por nome, patrimônio, marca, modelo, categoria ou localização.
- Filtros por status e categoria.
- Alteração rápida de status na lista.
- Exclusão com confirmação.
- Layout responsivo para computador e celular.
- Dados iniciais de demonstração, que podem ser editados ou excluídos.

## Estrutura
- `index.html`: estrutura semântica das páginas.
- `css/style.css`: identidade visual e responsividade.
- `js/script.js`: lógica, validações e persistência local.

## Quadro de tarefas sugerido
| Etapa | Tarefa | Situação inicial |
|---|---|---|
| Planejamento | Levantar requisitos e funcionalidades | Concluído |
| Design | Criar estrutura visual e navegação | Concluído |
| Desenvolvimento | Implementar cadastro, edição e exclusão | Concluído |
| Desenvolvimento | Implementar pesquisa, filtros e status | Concluído |
| Persistência | Salvar dados no LocalStorage | Concluído |
| Testes | Testar campos, filtros e ações | A realizar durante a apresentação |
| Entrega | Publicar o repositório no GitHub | A realizar pelo aluno |

## Observação
Este projeto é uma versão demonstrativa que armazena os dados apenas no navegador atual. Para uso por várias pessoas ou computadores, seria necessário adicionar uma API e um banco de dados com autenticação.
