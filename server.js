const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const graphqlHTTP = require('express-graphql');
const graphqlTools = require('graphql-tools');
const cors = require('cors');
const axios = require('axios');

let db = null;
//const url = 'mongodb://localhost:27017';
const url = "mongodb+srv://sistemas:pWvgtsWmkal9yf6f@cluster0.maw00.mongodb.net/GraphQLdb?retryWrites=true&w=majority";

const dbName = 'EmpresasGraphQLdb';
const port = 3001;

app.use(cors());

MongoClient.connect(url, {useNewUrlParser: true}, function(error, client) {
	if(error) console.log('ERRO de conexão:', error);
	else console.log(`banco de dados conectado com sucesso, ${url}`);

	db = client.db(dbName);
});

app.listen(port);
console.log(`servidor rodando em: localhost:${port}`);

function getCode() {
	try {
		const date = new Date();
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDate();
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const seconds = date.getSeconds();
		const milliseconds = date.getMilliseconds();
		const values = year+''+month+''+day+''+hours+''+minutes+''+seconds+''+milliseconds;
		const result = Number(parseFloat(Number(values)/2).toFixed(0));
		return result;
	}catch(error) {
		console.log({erro: error});
		return 0;
	}
}

const typeDefs = `
	type Empresa {
		_id: ID,
		codigo: Float,
		cnpj: String,
		nome: String,
		logradouro: String,
		numero: Float,
		complemento: String,
		municipio: String,
		uf: String,
		cep: String,
		telefone: String,
		email:String
	}

	input inputEmpresa {
		codigo: Float,
		cnpj: String,
		nome: String,
		logradouro: String,
		numero: Float,
		complemento: String,
		municipio: String,
		uf: String,
		cep: String,
		telefone: String,
		email:String		
	}

	type Query {
		resposta: String,
		saudacao(nome: String!): String,
		findEmpresaOne(codigo: Float): Empresa,
		findEmpresa(input: inputEmpresa): [Empresa]
		findEmpresaReceita(cnpj : Float) : Empresa
	}

	type Mutation {
		insertEmpresa(input: inputEmpresa): Empresa,
		updateEmpresa(codigo: Float, input: inputEmpresa): String,
		deleteEmpresa(codigo: Float): String
	}
`;

const resolvers = {
	Query: {
		resposta: function() {
			return 'GraphQL conectada com sucesso.';
		},
		saudacao: function(_, args) {
			return `Olá ${args.nome}! Seja muito bem vindo a GraphQL!`;
		},
		findEmpresaOne: function(_, {codigo}) {
			return db.collection('empresas').findOne({codigo: codigo}).then(function(result) {
				return result;
			});
		},
		findEmpresa: function(_, {input}) {
			return db.collection('empresas').find(input).toArray().then(function(result) {
				return result;
			});
		},
		findEmpresaReceita: function(_, {cnpj}) {
			console.log(cnpj)
			return axios.get(`http://www.receitaws.com.br/v1/cnpj/${cnpj}`).then(function(result) {
				console.log(result)
				
				var retorno = 
				{
					cnpj: result.data.cnpj,
					nome: result.data.nome,
					logradouro: result.data.logradouro,
					numero: result.data.numero,
					complemento: result.data.complemento,
					municipio: result.data.municipio,
					uf: result.data.uf,
					cep: result.data.cep,
					telefone: result.data.telefone,
					email: result.data.email
				}

				return retorno;
			});
		}
		
	},
	Mutation: {
		insertEmpresa: function(_, {input}) {
			input.codigo = getCode();
			return db.collection('empresas').insertOne(input).then(function(result) {
				return result.ops[0];
			});
		},
		updateEmpresa: function(_, args) {
			return db.collection('empresas').updateOne({codigo: args.codigo}, {$set: args.input})
			.then(function(result) {
				if(result.result.n>0) return 'Registro EDITADO com SUCESSO.';
				else return 'ERRO na edição!';
			});
		},
		deleteEmpresa: function(_, {codigo}) {
			return db.collection('empresas').deleteOne({codigo: codigo}).then(function(result) {
				if(result.result.n>0) return 'Registro DELETADO com SUCESSO.';
				else return 'ERRO na deleção!';				
			});
		}
	}
};

const schema = graphqlTools.makeExecutableSchema({
	typeDefs: typeDefs,
	resolvers: resolvers
});

app.use('/graphql', graphqlHTTP({
	graphiql: true,
	schema: schema
}));
